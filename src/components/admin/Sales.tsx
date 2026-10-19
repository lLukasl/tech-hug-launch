import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { units } from "@/lib/units";
import { formatBRL } from "@/lib/products";
import { FORMAS, periodRange, sumByForma, todaySP, type Pagamento, type Periodo } from "@/lib/finance";
import { OpenCash, SaleForm, Stat } from "@/components/admin/Finance";

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function Sales({ userId, email, isManager, isGlobal, userLoja }: { userId: string; email: string; isManager: boolean; isGlobal: boolean; userLoja: string | null }) {
  const qc = useQueryClient();
  const [loja, setLoja] = useState(isGlobal ? units[0].id : (userLoja ?? units[0].id));
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [fLoja, setFLoja] = useState("");
  const [fForma, setFForma] = useState("");
  const [showTotal, setShowTotal] = useState(true);
  const hoje = todaySP();

  const { data: session, isLoading } = useQuery({
    queryKey: ["cash", loja, hoje, "session"],
    queryFn: async () => {
      const { data } = await supabase.from("cash_sessions").select("*").eq("loja", loja).eq("data", hoje).maybeSingle();
      return data;
    },
  });

  const [ini, fim] = periodRange(periodo, hoje);
  const { data: sales } = useQuery({
    queryKey: ["sales-list", ini, fim],
    queryFn: async () => {
      // Fuso de Brasília (-03:00)
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .gte("created_at", `${ini}T00:00:00-03:00`)
        .lte("created_at", `${fim}T23:59:59-03:00`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["cash"] });
    qc.invalidateQueries({ queryKey: ["cash-items"] });
    qc.invalidateQueries({ queryKey: ["sales-list"] });
  };

  const list = (sales ?? [])
    .filter((s) => (!fLoja || s.loja === fLoja))
    .filter((s) => !fForma || (s.pagamentos as Pagamento[]).some((p) => p.forma === fForma))
    .map((s) => ({ ...s, pagamentos: s.pagamentos as Pagamento[] }));
  const byForma = sumByForma(list);
  const total = list.reduce((a, s) => a + Number(s.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="mr-auto text-2xl font-bold">{isManager ? "Vendas" : "Minhas vendas"}</h1>
        <div className="space-y-1">
          <Label>Loja do lançamento</Label>
          {isGlobal ? (
            <select className={sel} value={loja} onChange={(e) => setLoja(e.target.value)}>
              {units.map((u) => <option key={u.id} value={u.id}>{u.shortName}</option>)}
            </select>
          ) : (
            <p className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium">
              {units.find((u) => u.id === loja)?.shortName ?? loja}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      ) : !session ? (
        isManager ? (
          <OpenCash loja={loja} userId={userId} onDone={refresh} />
        ) : (
          <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-card">
            O caixa da unidade {units.find((u) => u.id === loja)?.shortName ?? loja} ainda não foi aberto pelo gerente hoje.
          </p>
        )
      ) : session.status !== "aberto" ? (
        <p className="text-muted-foreground">O caixa de hoje desta loja já foi fechado.</p>
      ) : (
        <div className="max-w-xl"><SaleForm session={session} userId={userId} email={email} onDone={refresh} /></div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex gap-1">
          {(["dia", "semana", "mes"] as Periodo[]).map((p) => (
            <Button key={p} size="sm" variant={periodo === p ? "default" : "outline"} onClick={() => setPeriodo(p)}>
              {p === "dia" ? "Hoje" : p === "semana" ? "Semana" : "Mês"}
            </Button>
          ))}
        </div>
        {isGlobal && (
          <select className={`${sel} w-auto`} value={fLoja} onChange={(e) => setFLoja(e.target.value)}>
            <option value="">Todas as lojas</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.shortName}</option>)}
          </select>
        )}
        <select className={`${sel} w-auto`} value={fForma} onChange={(e) => setFForma(e.target.value)}>
          <option value="">Todas as formas</option>
          {FORMAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setShowTotal((v) => !v)}>
          <Calculator className="mr-1 h-4 w-4" /> {showTotal ? "Ocultar total" : "Ver total"}
        </Button>
      </div>

      {showTotal && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl bg-cta p-3 text-cta-foreground shadow-card">
            <p className="text-xs opacity-90">{`Total (${list.length} vendas)`}</p>
            <p className="font-display text-lg font-bold">{formatBRL(total)}</p>
          </div>
          {FORMAS.map((f) => <Stat key={f.value} label={f.label} value={formatBRL(byForma[f.value])} />)}
        </div>
      )}

      {!list.length ? (
        <p className="text-sm text-muted-foreground">Nenhuma venda no período.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} ·{" "}
                  {units.find((u) => u.id === s.loja)?.shortName ?? s.loja} ·{" "}
                  {s.pagamentos.map((p) => `${FORMAS.find((f) => f.value === p.forma)?.label} ${formatBRL(p.valor)}`).join(" + ")}
                  {isManager && s.vendedor_email && ` · ${s.vendedor_email}`}
                </p>
              </div>
              <span className="font-semibold">{formatBRL(Number(s.total))}</span>
              <Button size="icon" variant="ghost" asChild title="Comprovante PDF">
                <a href={`/comprovante/${s.id}`} target="_blank" rel="noreferrer"><FileText className="h-4 w-4" /></a>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
