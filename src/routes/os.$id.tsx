import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/products";
import {
  NAO_DEIXOU,
  OS_STATUS,
  TIPOS_APARELHO,
  itemTotal,
  ordersTotal,
  unitById,
  type OsItem,
} from "@/lib/service-orders";

export const Route = createFileRoute("/os/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ordem de Serviço — Clínica Cell" },
      { name: "description", content: "Ordem de serviço da Clínica Cell." },
      { property: "og:title", content: "Ordem de Serviço — Clínica Cell" },
      { property: "og:description", content: "Ordem de serviço da Clínica Cell." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OsPrint,
});

function OsPrint() {
  const { id } = Route.useParams();
  const { data: o, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_orders").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-primary" />;
  if (!o)
    return (
      <div className="mx-auto mt-20 max-w-sm text-center">
        <p>Ordem não encontrada ou acesso restrito à equipe.</p>
        <Link to="/admin" className="mt-4 inline-block text-primary underline">Entrar no admin</Link>
      </div>
    );

  const itens = (o.itens as OsItem[]) ?? [];
  const unit = unitById(o.loja);
  const naoDeixou = NAO_DEIXOU.filter((n) => o.nao_deixou.includes(n.value)).map((n) => n.label);
  const row = (k: string, v: React.ReactNode) => (
    <div><span className="text-muted-foreground">{k}: </span><span className="font-medium">{v || "—"}</span></div>
  );

  return (
    <div className="mx-auto max-w-3xl bg-background p-6 text-sm text-foreground print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF</Button>
      </div>
      <header className="flex items-center gap-4 border-b border-border pb-4">
        <img src="/clinica-cell-logo.jpeg" alt="Clínica Cell" className="h-16 w-16" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">Clínica Cell</h1>
          <p className="text-muted-foreground">{unit?.name} · {unit?.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">OS #{o.numero}</p>
          <p>{new Date(o.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
          <p className="text-muted-foreground">{OS_STATUS.find((s) => s.value === o.status)?.label}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 border-b border-border py-4">
        {row("Cliente", o.cliente_nome)}
        {row("Telefone", o.cliente_telefone)}
        {row("Aparelho", TIPOS_APARELHO.find((t) => t.value === o.tipo_aparelho)?.label)}
        {row("Marca", o.marca)}
        {row("Modelo", o.modelo)}
        {row("Cor", o.cor)}
        {row("Quantidade", o.quantidade)}
        {row("Não deixou", naoDeixou.join(", "))}
      </section>

      <section className="space-y-2 border-b border-border py-4">
        {row("Defeito encontrado", o.defeito)}
        {row("Observações", o.observacoes)}
      </section>

      <section className="py-4">
        <h2 className="mb-2 font-semibold">Prestação de serviços</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-1">Qtd</th><th>Discriminação</th><th className="text-right">Unitário</th><th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i, k) => (
              <tr key={k} className="border-b border-border">
                <td className="py-1">{i.quantidade}</td><td>{i.discriminacao}</td>
                <td className="text-right">{formatBRL(i.preco_unitario)}</td>
                <td className="text-right">{formatBRL(itemTotal(i))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3} className="py-2 text-right font-semibold">Total</td><td className="text-right font-bold">{formatBRL(ordersTotal(itens))}</td></tr>
          </tfoot>
        </table>
      </section>

      <section className="border-t border-border py-4">
        <h2 className="font-semibold">Garantia: {o.garantia_dias} dias</h2>
        <p className="mt-2 whitespace-pre-line text-xs leading-relaxed">{o.termos_garantia}</p>
        <p className="mt-3">{o.ciente_termos ? "☑" : "☐"} Estou ciente dos termos de garantia</p>
      </section>

      <section className="grid grid-cols-2 gap-8 pt-6">
        {[["Clínica Cell", o.assinatura_loja], ["Cliente", o.assinatura_cliente]].map(([l, s]) => (
          <div key={l} className="text-center">
            <div className="flex h-24 items-end justify-center border-b border-foreground">
              {s && <img src={s} alt={`Assinatura ${l}`} className="max-h-24" />}
            </div>
            <p className="mt-1">{l}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
