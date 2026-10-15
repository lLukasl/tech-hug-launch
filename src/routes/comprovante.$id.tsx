import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/products";
import { unitById } from "@/lib/service-orders";
import { FORMAS, saleItemTotal, saleItemsTotal, type Pagamento, type SaleItem } from "@/lib/finance";

export const Route = createFileRoute("/comprovante/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Comprovante de Compra — Clínica Cell" },
      { name: "description", content: "Comprovante de compra simples da Clínica Cell." },
      { property: "og:title", content: "Comprovante de Compra — Clínica Cell" },
      { property: "og:description", content: "Comprovante de compra simples da Clínica Cell." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Receipt,
});

function Receipt() {
  const { id } = Route.useParams();
  const { data: s, isLoading } = useQuery({
    queryKey: ["receipt", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-primary" />;
  if (!s)
    return (
      <div className="mx-auto mt-20 max-w-sm text-center">
        <p>Comprovante não encontrado ou acesso restrito à equipe.</p>
        <Link to="/admin" className="mt-4 inline-block text-primary underline">Entrar no admin</Link>
      </div>
    );

  const unit = unitById(s.loja);
  const raw = (s.itens as SaleItem[]) ?? [];
  const itens: SaleItem[] = raw.length ? raw : [{ tipo: "avulsa", descricao: s.descricao, quantidade: 1, preco_unitario: Number(s.total) }];
  const pags = (s.pagamentos as Pagamento[]) ?? [];

  return (
    <div className="mx-auto max-w-3xl bg-background p-6 text-sm text-foreground print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Salvar PDF</Button>
      </div>
      <header className="flex items-center gap-4 border-b border-border pb-4">
        <img src="/clinica-cell-logo.jpeg" alt="Clínica Cell" className="h-16 w-16" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">Clínica Cell</h1>
          <p className="text-muted-foreground">{unit?.name} · {unit?.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">Comprovante #{s.numero}</p>
          <p>{new Date(s.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 border-b border-border py-4">
        <div><span className="text-muted-foreground">Cliente: </span><span className="font-medium">{s.cliente_nome || "—"}</span></div>
        <div><span className="text-muted-foreground">Telefone: </span><span className="font-medium">{s.cliente_telefone || "—"}</span></div>
      </section>

      <section className="py-4">
        <h2 className="mb-2 font-semibold">Itens</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-1">Qtd</th><th>Descrição</th><th className="text-right">Unitário</th><th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i, k) => (
              <tr key={k} className="border-b border-border">
                <td className="py-1">{i.quantidade}</td><td>{i.descricao}</td>
                <td className="text-right">{formatBRL(i.preco_unitario)}</td>
                <td className="text-right">{formatBRL(saleItemTotal(i))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3} className="py-2 text-right font-semibold">Total</td><td className="text-right font-bold">{formatBRL(saleItemsTotal(itens))}</td></tr>
          </tfoot>
        </table>
      </section>

      <section className="border-t border-border py-4">
        <h2 className="mb-1 font-semibold">Pagamento</h2>
        {pags.map((p, k) => (
          <p key={k}>{FORMAS.find((f) => f.value === p.forma)?.label}: {formatBRL(p.valor)}</p>
        ))}
      </section>

      <p className="border-t border-border pt-4 text-xs text-muted-foreground">
        Comprovante simples de compra, sem valor fiscal. Obrigado pela preferência!
      </p>
    </div>
  );
}
