import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock, Plus, Trash2, Unlock } from "lucide-react";
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
  type Pagamento,
} from "@/lib/finance";

type Totals = { credito: number; debito: number; pix: number; dinheiro: number; vendas: number; sangrias: number };
const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const formaLabel = (f: string) => FORMAS.find((x) => x.value === f)?.label ?? f;

export function Finance({ userId, email, isManager }: { userId: string; email: string; isManager: boolean }) {
  const qc = useQueryClient();
  const [loja, setLoja] = useState(units[0].id);
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
          <select className={sel} value={loja} onChange={(e) => setLoja(e.target.value)}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.shortName}</option>
            ))}
          </select>
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

function OpenCash({ loja, userId, onDone }: { loja: string; userId: string; onDone: () => void }) {
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

type Session = {
  id: string;
  loja: string;
  troco_inicial: number;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${open ? "bg-cta text-cta-foreground" : "bg-muted text-muted-foreground"}`}>
          {open ? "CAIXA ABERTO" : "CAIXA FECHADO"}
        </span>
        <span className="text-sm text-muted-foreground">Troco inicial: {formatBRL(Number(session.troco_inicial))}</span>
        {!open && isManager && (
          <Button size="sm" variant="outline" className="ml-auto" onClick={reopen}>
            <Unlock className="mr-1 h-4 w-4" /> Reabrir
          </Button>
        )}
      </div>

      {totals && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FORMAS.map((f) => (
            <Stat key={f.value} label={f.label} value={formatBRL(Number(totals[f.value]))} />
          ))}
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
                  </p>
                </div>
                <span className="font-semibold">{formatBRL(Number(s.total))}</span>
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

function Stat({ label, value }: { label: string; value: string }) {
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

function SaleForm({ session, userId, email, onDone }: { session: Session; userId: string; email: string; onDone: () => void }) {
  const qc = useQueryClient();
  const [origem, setOrigem] = useState<"avulsa" | "produto" | "os">("avulsa");
  const [descricao, setDescricao] = useState("");
  const [ref, setRef] = useState("");
  const [pags, setPags] = useState<Pagamento[]>([{ forma: "pix", valor: 0 }]);
  const [busy, setBusy] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["sale-products"],
    enabled: origem === "produto",
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("status", "disponivel").order("nome");
      return data ?? [];
    },
  });
  const { data: orders } = useQuery({
    queryKey: ["sale-os", session.loja],
    enabled: origem === "os",
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select("id, numero, cliente_nome, modelo, itens")
        .eq("loja", session.loja)
        .neq("status", "entregue")
        .order("numero", { ascending: false });
      return data ?? [];
    },
  });

  const pick = (id: string) => {
    setRef(id);
    if (origem === "produto") {
      const p = products?.find((x) => x.id === id);
      if (p) {
        setDescricao(fullName(p as never));
        setPags([{ forma: pags[0]?.forma ?? "pix", valor: Number(p.preco) }]);
      }
    } else {
      const o = orders?.find((x) => x.id === id);
      if (o) {
        setDescricao(`OS #${o.numero} — ${o.cliente_nome}`);
        const itens = (o.itens as { quantidade: number; preco_unitario: number }[]) ?? [];
        const total = itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);
        setPags([{ forma: pags[0]?.forma ?? "pix", valor: Math.round(total * 100) / 100 }]);
      }
    }
  };

  const total = pagamentosTotal(pags);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return toast.error("Informe a descrição.");
    if (total <= 0) return toast.error("Informe o valor.");
    if (origem !== "avulsa" && !ref) return toast.error("Selecione o item.");
    setBusy(true);
    const { error } = await supabase.from("sales").insert({
      session_id: session.id,
      loja: session.loja,
      vendedor_id: userId,
      vendedor_email: email,
      descricao: descricao.trim(),
      origem,
      product_id: origem === "produto" ? ref : null,
      service_order_id: origem === "os" ? ref : null,
      pagamentos: pags.filter((p) => p.valor > 0),
      total,
    });
    if (!error && origem === "produto") await supabase.from("products").update({ status: "vendido" }).eq("id", ref);
    if (!error && origem === "os") await supabase.from("service_orders").update({ status: "entregue" }).eq("id", ref);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Venda lançada.");
    setDescricao("");
    setRef("");
    setPags([{ forma: "pix", valor: 0 }]);
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["service-orders"] });
    qc.invalidateQueries({ queryKey: ["sale-products"] });
    qc.invalidateQueries({ queryKey: ["sale-os"] });
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-semibold">Lançar venda</h2>
      <select className={sel} value={origem} onChange={(e) => { setOrigem(e.target.value as typeof origem); setRef(""); }}>
        <option value="avulsa">Venda avulsa</option>
        <option value="produto">Produto do encarte</option>
        <option value="os">Ordem de serviço</option>
      </select>
      {origem === "produto" && (
        <select className={sel} value={ref} onChange={(e) => pick(e.target.value)}>
          <option value="">Selecione o produto…</option>
          {products?.map((p) => (
            <option key={p.id} value={p.id}>{fullName(p as never)} — {formatBRL(Number(p.preco))}</option>
          ))}
        </select>
      )}
      {origem === "os" && (
        <select className={sel} value={ref} onChange={(e) => pick(e.target.value)}>
          <option value="">Selecione a OS…</option>
          {orders?.map((o) => (
            <option key={o.id} value={o.id}>OS #{o.numero} — {o.cliente_nome}</option>
          ))}
        </select>
      )}
      <Input placeholder="Descrição (ex.: Película 9H)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
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
      <div className="flex items-center justify-between">
        <span className="font-semibold">Total: {formatBRL(total)}</span>
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
