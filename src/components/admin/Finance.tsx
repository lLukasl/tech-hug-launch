import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Loader2, Lock, Plus, Trash2, Unlock } from "lucide-react";
import { buildCashCsv, downloadCsv } from "@/lib/cash-export";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { units } from "@/lib/units";
import { formatBRL, fullName } from "@/lib/products";
import { processPhoto } from "@/lib/image";
import {
  CASH_BUCKET,
  FORMAS,
  cashDiff,
  expectedCash,
  pagamentosTotal,
  todaySP,
  saleItemTotal,
  saleItemsTotal,
  salePricing,
  saleRecordDiscount,
  type Pagamento,
  type SaleItem,
} from "@/lib/finance";

type Totals = { credito: number; debito: number; pix: number; dinheiro: number; vendas: number; sangrias: number };
const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const formaLabel = (f: string) => FORMAS.find((x) => x.value === f)?.label ?? f;
const saleDiscountLabel = (itens: unknown, total: number) => {
  const d = saleRecordDiscount(itens, total);
  return d > 0 ? ` · Desconto − ${formatBRL(d)}` : "";
};

export function Finance({ userId, email, isManager, isGlobal, userLoja, userLojas }: { userId: string; email: string; isManager: boolean; isGlobal: boolean; userLoja: string | null; userLojas?: string[] }) {
  const qc = useQueryClient();
  const lojaUnits = isGlobal ? units : units.filter((u) => (userLojas?.length ? userLojas : [userLoja]).includes(u.id));
  const [loja, setLoja] = useState(isGlobal ? units[0].id : (userLoja ?? units[0].id));
  const [data, setData] = useState(todaySP());
  const isToday = data === todaySP();
  const key = ["cash", loja, data];

  const { data: session, isLoading } = useQuery({
    queryKey: [...key, "session"],
    queryFn: async () => {
      const { data: s, error } = await supabase
        .from("cash_sessions")
        .select("*")
        .eq("loja", loja)
        .eq("data", data)
        .maybeSingle();
      if (error) throw error;
      return s;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="mr-auto text-2xl font-bold">Financeiro · Caixa</h1>
        <div className="space-y-1">
          <Label>Loja</Label>
          {lojaUnits.length > 1 ? (
            <select className={sel} value={loja} onChange={(e) => setLoja(e.target.value)}>
              {lojaUnits.map((u) => (
                <option key={u.id} value={u.id}>{u.shortName}</option>
              ))}
            </select>
          ) : (
            <p className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium">
              {units.find((u) => u.id === loja)?.shortName ?? loja}
            </p>
          )}
        </div>
        {isManager && (
          <div className="space-y-1">
            <Label>Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        )}
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      ) : !session ? (
        isToday ? (
          <OpenCash loja={loja} userId={userId} onDone={refresh} />
        ) : (
          <p className="text-muted-foreground">Nenhum caixa aberto nesta data.</p>
        )
      ) : (
        <SessionView session={session} userId={userId} email={email} isManager={isManager} onChange={refresh} />
      )}
    </div>
  );
}

export function OpenCash({ loja, userId, onDone }: { loja: string; userId: string; onDone: () => void }) {
  const [troco, setTroco] = useState("");
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("cash_sessions")
      .insert({ loja, data: todaySP(), troco_inicial: Number(troco) || 0, aberto_por: userId });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Caixa aberto.");
    onDone();
  };
  return (
    <div className="max-w-sm space-y-3 rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="font-semibold">Caixa de hoje ainda não foi aberto</p>
      <Label>Troco inicial (R$)</Label>
      <Input type="number" step="0.01" min="0" value={troco} onChange={(e) => setTroco(e.target.value)} />
      <Button className="w-full" onClick={open} disabled={busy}>
        <Unlock className="mr-2 h-4 w-4" /> Abrir caixa
      </Button>
    </div>
  );
}

export type Session = {
  id: string;
  loja: string;
  troco_inicial: number;
  aberto_em?: string;
  status: string;
  dinheiro_contado: number | null;
  foto_maquininha: string | null;
  observacoes: string | null;
};

function SessionView({ session, userId, email, isManager, onChange }: { session: Session; userId: string; email: string; isManager: boolean; onChange: () => void }) {
  const qc = useQueryClient();
  const open = session.status === "aberto";
  const sk = ["cash-items", session.id];

  const { data: totals } = useQuery({
    queryKey: [...sk, "totals"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("session_totals", { _session_id: session.id });
      if (error) throw error;
      return data as unknown as Totals;
    },
  });
  const { data: sales } = useQuery({
    queryKey: [...sk, "sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: withdrawals } = useQuery({
    queryKey: [...sk, "w"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_withdrawals")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: photoUrl } = useQuery({
    queryKey: [...sk, "photo", session.foto_maquininha],
    enabled: !!session.foto_maquininha && isManager,
    queryFn: async () => {
      const { data } = await supabase.storage.from(CASH_BUCKET).createSignedUrl(session.foto_maquininha!, 3600);
      return data?.signedUrl ?? null;
    },
  });
  const refreshItems = () => qc.invalidateQueries({ queryKey: sk });

  const esperado = totals ? expectedCash(Number(session.troco_inicial), Number(totals.dinheiro), Number(totals.sangrias)) : 0;

  const reopen = async () => {
    const { error } = await supabase.from("cash_sessions").update({ status: "aberto" }).eq("id", session.id);
    if (error) return toast.error(error.message);
    onChange();
  };

  const exportCsv = () => {
    if (!totals) return;
    const lojaName = units.find((u) => u.id === session.loja)?.name ?? session.loja;
    const csv = buildCashCsv({
      data: new Date(session.aberto_em ?? Date.now()).toLocaleDateString("pt-BR"),
      loja: lojaName,
      trocoInicial: Number(session.troco_inicial),
      totals,
      esperado,
      dinheiroContado: session.dinheiro_contado == null ? null : Number(session.dinheiro_contado),
      status: open ? "Aberto" : "Fechado",
      sales: (sales ?? []).map((s) => ({ ...s, pagamentos: s.pagamentos as Pagamento[], total: Number(s.total) })),
      withdrawals: (withdrawals ?? []).map((w) => ({ ...w, valor: Number(w.valor) })),
      formaLabel,
    });
    downloadCsv(csv, `caixa-${session.loja}-${(session.aberto_em ?? new Date().toISOString()).slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${open ? "bg-cta text-cta-foreground" : "bg-muted text-muted-foreground"}`}>
          {open ? "CAIXA ABERTO" : "CAIXA FECHADO"}
        </span>
        <span className="text-sm text-muted-foreground">Troco inicial: {formatBRL(Number(session.troco_inicial))}</span>
        {isManager && totals && (
          <Button size="sm" variant="outline" className="ml-auto" onClick={exportCsv}>
            <Download className="mr-1 h-4 w-4" /> Exportar caixa (Excel / Sheets)
          </Button>
        )}
        {!open && isManager && (
          <Button size="sm" variant="outline" onClick={reopen}>
            <Unlock className="mr-1 h-4 w-4" /> Reabrir
          </Button>
        )}
      </div>

      {totals && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {FORMAS.map((f) => (
            <Stat key={f.value} label={f.label} value={formatBRL(Number(totals[f.value]))} />
          ))}
          <div className="rounded-xl bg-cta p-3 text-cta-foreground shadow-card">
            <p className="text-xs opacity-90">{`Total do dia (${totals.vendas} vendas)`}</p>
            <p className="font-display text-lg font-bold">{formatBRL(FORMAS.reduce((a, f) => a + Number(totals[f.value]), 0))}</p>
          </div>
          <Stat label="Sangrias" value={formatBRL(Number(totals.sangrias))} />
          <Stat label="Dinheiro esperado" value={formatBRL(esperado)} />
        </div>
      )}

      {open && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SaleForm session={session} userId={userId} email={email} onDone={refreshItems} />
          <WithdrawalForm sessionId={session.id} userId={userId} email={email} onDone={refreshItems} />
        </div>
      )}

      <section>
        <h2 className="mb-2 font-semibold">{isManager ? "Vendas do caixa" : "Minhas vendas"}</h2>
        {!sales?.length ? (
          <p className="text-sm text-muted-foreground">Nenhuma venda lançada.</p>
        ) : (
          <ul className="space-y-2">
            {sales.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleTimeString("pt-BR", { timeStyle: "short" })} ·{" "}
                    {(s.pagamentos as Pagamento[]).map((p) => `${formaLabel(p.forma)} ${formatBRL(p.valor)}`).join(" + ")}
                    {isManager && s.vendedor_email && ` · ${s.vendedor_email}`}
                    {saleDiscountLabel(s.itens, Number(s.total))}
                  </p>
                </div>
                <span className="font-semibold">{formatBRL(Number(s.total))}</span>
                <Button size="icon" variant="ghost" asChild title="Comprovante PDF">
                  <a href={`/comprovante/${s.id}`} target="_blank" rel="noreferrer"><FileText className="h-4 w-4" /></a>
                </Button>
                {(isManager || (open && s.vendedor_id === userId)) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={async () => {
                      const { error } = await supabase.from("sales").delete().eq("id", s.id);
                      if (error) return toast.error(error.message);
                      refreshItems();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!!withdrawals?.length && (
        <section>
          <h2 className="mb-2 font-semibold">Sangrias</h2>
          <ul className="space-y-2">
            {withdrawals.map((w) => (
              <li key={w.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                <span className="flex-1">{w.motivo}{isManager && w.criado_por_email && ` · ${w.criado_por_email}`}</span>
                <span className="font-semibold">− {formatBRL(Number(w.valor))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {open ? (
        <CloseCash session={session} userId={userId} esperado={esperado} onDone={onChange} />
      ) : (
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-semibold">Fechamento</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Dinheiro esperado" value={formatBRL(esperado)} />
            <Stat label="Dinheiro contado" value={formatBRL(Number(session.dinheiro_contado ?? 0))} />
            <DiffStat diff={cashDiff(Number(session.dinheiro_contado ?? 0), esperado)} />
          </div>
          {session.observacoes && <p className="mt-3 text-sm">Obs.: {session.observacoes}</p>}
          {isManager && photoUrl && (
            <a href={photoUrl} target="_blank" rel="noreferrer">
              <img src={photoUrl} alt="Relatório da maquininha" className="mt-4 max-h-96 rounded-lg border border-border" />
            </a>
          )}
        </section>
      )}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-bold">{value}</p>
    </div>
  );
}

function DiffStat({ diff }: { diff: number }) {
  const label = diff === 0 ? "Sem diferença" : diff > 0 ? "Sobra" : "Falta";
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-display text-lg font-bold ${diff < 0 ? "text-destructive" : ""}`}>{formatBRL(Math.abs(diff))}</p>
    </div>
  );
}

export function SaleForm({ session, userId, email, onDone }: { session: Session; userId: string; email: string; onDone: () => void }) {
  const qc = useQueryClient();
  const [itens, setItens] = useState<SaleItem[]>([]);
  const [add, setAdd] = useState<SaleItem["tipo"]>("avulsa");
  const [avDesc, setAvDesc] = useState("");
  const [avQtd, setAvQtd] = useState("1");
  const [avPreco, setAvPreco] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pags, setPags] = useState<Pagamento[]>([{ forma: "pix", valor: 0 }]);
  const [busy, setBusy] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["sale-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("status", "disponivel").order("nome");
      return data ?? [];
    },
  });
  const { data: orders } = useQuery({
    queryKey: ["sale-os", session.loja],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select("id, numero, cliente_nome, cliente_telefone, itens")
        .eq("loja", session.loja)
        .neq("status", "entregue")
        .order("numero", { ascending: false });
      return data ?? [];
    },
  });

  const [negotiatedTotal, setNegotiatedTotal] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const used = new Set(itens.map((i) => i.ref).filter(Boolean));
  const push = (i: SaleItem) => {
    const next = [...itens, i];
    setItens(next);
    setNegotiatedTotal("");
    setDiscountInput("");
    setPags(pags.length === 1 ? [{ ...pags[0], valor: saleItemsTotal(next) }] : pags);
  };
  const removeAt = (k: number) => {
    const next = itens.filter((_, j) => j !== k);
    setItens(next);
    setNegotiatedTotal("");
    setDiscountInput("");
    if (pags.length === 1) setPags([{ ...pags[0], valor: saleItemsTotal(next) }]);
  };
  const pickProduct = (id: string) => {
    const p = products?.find((x) => x.id === id);
    if (p) push({ tipo: "produto", ref: p.id, descricao: fullName(p as never), quantidade: 1, preco_unitario: Number(p.preco) });
  };
  const pickOs = (id: string) => {
    const o = orders?.find((x) => x.id === id);
    if (!o) return;
    const its = (o.itens as { quantidade: number; preco_unitario: number }[]) ?? [];
    const total = Math.round(its.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0) * 100) / 100;
    push({ tipo: "os", ref: o.id, descricao: `OS #${o.numero} — ${o.cliente_nome}`, quantidade: 1, preco_unitario: total });
    if (!cliente) setCliente(o.cliente_nome);
    if (!telefone) setTelefone(o.cliente_telefone);
  };
  const addAvulsa = () => {
    if (!avDesc.trim() || !(Number(avPreco) > 0)) return toast.error("Informe descrição e preço.");
    push({ tipo: "avulsa", descricao: avDesc.trim(), quantidade: Math.max(1, Number(avQtd) || 1), preco_unitario: Number(avPreco) });
    setAvDesc(""); setAvQtd("1"); setAvPreco("");
  };

  const totalItens = saleItemsTotal(itens);
  const pricing = salePricing(totalItens, negotiatedTotal === "" ? totalItens : Number(negotiatedTotal));
  const total = pricing.total;
  const totalPago = pagamentosTotal(pags);
  const changeTotal = (value: string) => {
    setNegotiatedTotal(value);
    const nextTotal = value === "" ? totalItens : Number(value);
    const d = Math.round((totalItens - nextTotal) * 100) / 100;
    setDiscountInput(Number.isFinite(d) && d > 0 ? String(d) : "");
    if (pags.length === 1 && Number.isFinite(nextTotal)) {
      setPags([{ ...pags[0], valor: nextTotal }]);
    }
  };
  const changeDiscount = (value: string) => {
    setDiscountInput(value);
    const d = Number(value);
    const nextTotal = value === "" || !Number.isFinite(d) ? totalItens : Math.round((totalItens - d) * 100) / 100;
    setNegotiatedTotal(nextTotal === totalItens ? "" : String(nextTotal));
    if (pags.length === 1) setPags([{ ...pags[0], valor: nextTotal }]);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itens.length) return toast.error("Adicione pelo menos um item.");
    if (!pricing.valid) return toast.error("Informe um total maior que zero e não superior à soma dos itens.");
    if (pags.some((p) => !Number.isFinite(p.valor) || p.valor < 0)) return toast.error("Informe valores de pagamento válidos.");
    if (totalPago !== total) return toast.error(`Pagamento (${formatBRL(totalPago)}) diferente do total final (${formatBRL(total)}).`);
    setBusy(true);
    const prod = itens.find((i) => i.tipo === "produto");
    const os = itens.find((i) => i.tipo === "os");
    const { data: sale, error } = await supabase
      .from("sales")
      .insert({
        session_id: session.id,
        loja: session.loja,
        vendedor_id: userId,
        vendedor_email: email,
        descricao: itens.map((i) => (i.quantidade > 1 ? `${i.quantidade}x ${i.descricao}` : i.descricao)).join(" + "),
        origem: os ? "os" : prod ? "produto" : "avulsa",
        product_id: prod?.ref ?? null,
        service_order_id: os?.ref ?? null,
        itens: itens as never,
        cliente_nome: cliente.trim() || null,
        cliente_telefone: telefone.trim() || null,
        pagamentos: pags.filter((p) => p.valor > 0),
        total,
      })
      .select("id")
      .single();
    if (!error) {
      const pIds = itens.filter((i) => i.tipo === "produto").map((i) => i.ref!);
      const oIds = itens.filter((i) => i.tipo === "os").map((i) => i.ref!);
      if (pIds.length) await supabase.from("products").update({ status: "baixado" }).in("id", pIds);
      if (oIds.length) await supabase.from("service_orders").update({ status: "entregue" }).in("id", oIds);
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Venda lançada.", {
      action: { label: "Comprovante", onClick: () => window.open(`/comprovante/${sale.id}`, "_blank") },
    });
    setItens([]); setCliente(""); setTelefone(""); setNegotiatedTotal("");
    setPags([{ forma: "pix", valor: 0 }]);
    ["products", "service-orders", "sale-products", "sale-os", "sales-list"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-semibold">Lançar venda</h2>

      {!!itens.length && (
        <ul className="space-y-1 rounded-lg border border-border p-2 text-sm">
          {itens.map((i, k) => (
            <li key={k} className="flex items-center gap-2">
              <span className="flex-1">{i.quantidade}x {i.descricao}</span>
              <span className="font-medium">{formatBRL(saleItemTotal(i))}</span>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeAt(k)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          <li className="border-t border-border pt-1 text-right font-semibold">Itens: {formatBRL(totalItens)}</li>
        </ul>
      )}

      <div className="space-y-2 rounded-lg bg-muted/40 p-3">
        <Label>Adicionar item</Label>
        <select className={sel} value={add} onChange={(e) => setAdd(e.target.value as SaleItem["tipo"])}>
          <option value="avulsa">Item avulso</option>
          <option value="produto">Produto do encarte</option>
          <option value="os">Ordem de serviço</option>
        </select>
        {add === "produto" && (
          <select className={sel} value="" onChange={(e) => pickProduct(e.target.value)}>
            <option value="">Selecione o produto…</option>
            {products?.filter((p) => !used.has(p.id)).map((p) => (
              <option key={p.id} value={p.id}>{fullName(p as never)} — {formatBRL(Number(p.preco))}</option>
            ))}
          </select>
        )}
        {add === "os" && (
          <select className={sel} value="" onChange={(e) => pickOs(e.target.value)}>
            <option value="">Selecione a OS…</option>
            {orders?.filter((o) => !used.has(o.id)).map((o) => (
              <option key={o.id} value={o.id}>OS #{o.numero} — {o.cliente_nome}</option>
            ))}
          </select>
        )}
        {add === "avulsa" && (
          <div className="flex flex-wrap gap-2">
            <Input className="min-w-40 flex-1" placeholder="Descrição (ex.: Película 9H)" value={avDesc} onChange={(e) => setAvDesc(e.target.value)} />
            <Input className="w-16" type="number" min="1" value={avQtd} onChange={(e) => setAvQtd(e.target.value)} />
            <Input className="w-28" type="number" step="0.01" min="0" placeholder="Preço un." value={avPreco} onChange={(e) => setAvPreco(e.target.value)} />
            <Button type="button" variant="outline" onClick={addAvulsa}><Plus className="h-4 w-4" /></Button>
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="Nome do cliente (opcional)" value={cliente} onChange={(e) => setCliente(e.target.value)} />
        <Input placeholder="Telefone (opcional)" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span>Subtotal dos itens</span><span>{formatBRL(totalItens)}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`sale-total-${session.id}`}>Total final (R$)</Label>
            <Input
              id={`sale-total-${session.id}`}
              type="number" step="0.01" min="0.01" max={totalItens}
              value={negotiatedTotal === "" ? totalItens : negotiatedTotal}
              onChange={(e) => changeTotal(e.target.value)}
              disabled={!itens.length}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`sale-desconto-${session.id}`}>Desconto (R$)</Label>
            <Input
              id={`sale-desconto-${session.id}`}
              type="number" step="0.01" min="0" max={totalItens}
              placeholder="0,00"
              value={discountInput}
              onChange={(e) => changeDiscount(e.target.value)}
              disabled={!itens.length}
            />
          </div>
        </div>
        {pricing.discount > 0 && pricing.valid && (
          <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
            Desconto aplicado: − {formatBRL(pricing.discount)} · cliente paga {formatBRL(total)}
          </p>
        )}
        {negotiatedTotal !== "" && !pricing.valid && (
          <p className="text-sm text-destructive">O total deve ser maior que zero e não superar o subtotal.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Pagamento</Label>
        {pags.map((p, i) => (
          <div key={i} className="flex gap-2">
            <select
              className={sel}
              value={p.forma}
              onChange={(e) => setPags(pags.map((x, j) => (j === i ? { ...x, forma: e.target.value as Pagamento["forma"] } : x)))}
            >
              {FORMAS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Valor"
              aria-label={`Valor do pagamento ${i + 1}`}
              value={p.valor || ""}
              onChange={(e) => setPags(pags.map((x, j) => (j === i ? { ...x, valor: Number(e.target.value) } : x)))}
            />
            {pags.length > 1 && (
              <Button type="button" size="icon" variant="ghost" onClick={() => setPags(pags.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => setPags([...pags, { forma: "credito", valor: 0 }])}>
          <Plus className="mr-1 h-4 w-4" /> Dividir pagamento
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">Total: {formatBRL(total)}</p>
          <p className={`text-sm ${totalPago === total ? "text-muted-foreground" : "text-destructive"}`}>
            Pagamentos: {formatBRL(totalPago)}
          </p>
        </div>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lançar
        </Button>
      </div>
    </form>
  );
}

function WithdrawalForm({ sessionId, userId, email, onDone }: { sessionId: string; userId: string; email: string; onDone: () => void }) {
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(Number(valor) > 0) || !motivo.trim()) return toast.error("Informe valor e motivo.");
    const { error } = await supabase.from("cash_withdrawals").insert({
      session_id: sessionId,
      valor: Number(valor),
      motivo: motivo.trim(),
      criado_por: userId,
      criado_por_email: email,
    });
    if (error) return toast.error(error.message);
    toast.success("Sangria registrada.");
    setValor("");
    setMotivo("");
    onDone();
  };
  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-semibold">Sangria / retirada</h2>
      <Input type="number" step="0.01" min="0" placeholder="Valor (R$)" value={valor} onChange={(e) => setValor(e.target.value)} />
      <Input placeholder="Motivo (ex.: compra de material)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      <Button type="submit" variant="outline" className="w-full">Registrar sangria</Button>
    </form>
  );
}

function CloseCash({ session, userId, esperado, onDone }: { session: Session; userId: string; esperado: number; onDone: () => void }) {
  const [contado, setContado] = useState("");
  const [obs, setObs] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const diff = contado === "" ? null : cashDiff(Number(contado), esperado);

  const close = async () => {
    if (contado === "") return toast.error("Informe o dinheiro contado na gaveta.");
    if (!file) return toast.error("Envie a foto do relatório da maquininha.");
    setBusy(true);
    try {
      const blob = await processPhoto(file, false);
      const path = `${session.id}/${Date.now()}.jpg`;
      const up = await supabase.storage.from(CASH_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const { error } = await supabase
        .from("cash_sessions")
        .update({
          status: "fechado",
          dinheiro_contado: Number(contado),
          foto_maquininha: path,
          observacoes: obs.trim() || null,
          fechado_por: userId,
          fechado_em: new Date().toISOString(),
        })
        .eq("id", session.id);
      if (error) throw error;
      toast.success("Caixa fechado.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao fechar caixa.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-semibold">Fechamento do caixa</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Dinheiro contado na gaveta (R$)</Label>
          <Input type="number" step="0.01" min="0" value={contado} onChange={(e) => setContado(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Foto do relatório da maquininha</Label>
          <Input type="file" accept="image/*,.heic,.heif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </div>
      {diff !== null && (
        <p className={`text-sm font-semibold ${diff < 0 ? "text-destructive" : ""}`}>
          Esperado {formatBRL(esperado)} · {diff === 0 ? "Sem diferença" : diff > 0 ? `Sobra ${formatBRL(diff)}` : `Falta ${formatBRL(-diff)}`}
        </p>
      )}
      <Input placeholder="Observações (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
      <Button onClick={close} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />} Fechar caixa
      </Button>
    </section>
  );
}
