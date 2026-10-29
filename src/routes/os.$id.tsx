import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Download, Loader2, Printer, Receipt, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { downloadFile, elementToPdf, sharePdf } from "@/lib/os-pdf";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/products";
import {
  NAO_DEIXOU,
  AVISO_RISCOS,
  ESTADO_ENTRADA,
  RISCOS_ABERTURA,
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
  const docRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [termico, setTermico] = useState<58 | 80 | null>(null);
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

  const fileName = `OS_${String(o.numero).padStart(5, "0")}_ClinicaCell.pdf`;
  const total = itens.reduce((s, i) => s + (Number(i.quantidade) || 0) * (Number(i.preco_unitario) || 0), 0);
  const shareText = [
    `Olá, ${o.cliente_nome}! Tudo bem?`,
    `Segue em anexo a Ordem de Serviço *#${o.numero}* da Clínica Cell${unit ? ` — ${unit.name}` : ""}.`,
    ``,
    `📱 Aparelho: ${[o.marca, o.modelo].filter(Boolean).join(" ")}`,
    total > 0 ? `💰 Valor: ${formatBRL(total)}` : "",
    o.garantia_dias ? `🛡️ Garantia: ${o.garantia_dias} dias` : "",
    ``,
    unit ? `Qualquer dúvida, fale com a gente: ${unit.phone}` : "",
  ].filter((l, i, a) => l !== "" || (a[i - 1] ?? "") !== "").join("\n");
  const telDigits = (o.cliente_telefone ?? "").replace(/\D/g, "");
  const gerarPdf = async (modo: "share" | "download") => {
    if (!docRef.current) return;
    if (modo === "share" && telDigits.length < 10) {
      toast.error("Telefone do cliente inválido na OS. Corrija o número antes de enviar.");
      return;
    }
    setBusy(true);
    try {
      const file = await elementToPdf(docRef.current, fileName);
      if (modo === "download") return downloadFile(file);
      const r = await sharePdf(file, shareText, o.cliente_telefone);
      if (r === "downloaded")
        toast.success(`PDF baixado e conversa com ${o.cliente_nome} aberta. Anexe o arquivo baixado na conversa.`, { duration: 10000 });
    } catch (e) {
      toast.error("Não foi possível gerar o PDF: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const imprimirTermico = (w: 58 | 80) => {
    setTermico(w);
    const reset = () => { setTermico(null); window.removeEventListener("afterprint", reset); };
    window.addEventListener("afterprint", reset);
    setTimeout(() => window.print(), 150);
  };

  if (termico) return <ThermalTicket o={o} itens={itens} width={termico} naoDeixou={naoDeixou} />;

  return (
    <div className="mx-auto max-w-3xl bg-background p-6 text-sm text-foreground print:p-0">
      <div className="mb-4 flex flex-wrap justify-end gap-2 print:hidden">
        <Button disabled={busy} className="bg-cta text-cta-foreground hover:bg-cta/90" onClick={() => gerarPdf("share")}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />} Enviar PDF no WhatsApp
        </Button>
        <Button disabled={busy} variant="outline" onClick={() => gerarPdf("download")}><Download className="mr-2 h-4 w-4" /> Baixar PDF</Button>
        <Button variant="outline" onClick={() => imprimirTermico(80)}><Receipt className="mr-2 h-4 w-4" /> Térmica 80mm</Button>
        <Button variant="outline" onClick={() => imprimirTermico(58)}><Receipt className="mr-2 h-4 w-4" /> Térmica 58mm</Button>
        <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir A4</Button>
      </div>
      <Toaster />
      <div ref={docRef} className="bg-background p-2">
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

      <section className="my-2 space-y-1 rounded border-2 border-primary p-3 print:break-inside-avoid">
        <h2 className="font-semibold">Riscos na abertura do aparelho</h2>
        <p>
          <strong>Estado na entrada:</strong>{" "}
          {ESTADO_ENTRADA.find((s) => s.value === o.estado_entrada)?.label ?? o.estado_entrada}
        </p>
        {o.riscos?.length > 0 && (
          <ul className="list-inside list-disc text-xs">
            {o.riscos.map((r: string) => (
              <li key={r}>{RISCOS_ABERTURA.find((x) => x.value === r)?.label ?? r}</li>
            ))}
          </ul>
        )}
        <p className="text-xs leading-relaxed">{AVISO_RISCOS}</p>
        <p>{o.ciente_riscos ? "☑" : "☐"} Cliente avisado e ciente dos riscos da abertura</p>
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

      {o.servicos_realizados && (
        <section className="border-t border-border py-4">
          <h2 className="mb-1 font-semibold">Serviços realizados</h2>
          <p className="whitespace-pre-line">{o.servicos_realizados}</p>
        </section>
      )}

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
    </div>
  );
}

type Order = Record<string, any>;
function ThermalTicket({ o, itens, width, naoDeixou }: { o: Order; itens: OsItem[]; width: 58 | 80; naoDeixou: string[] }) {
  const unit = unitById(o.loja);
  const hr = <div className="my-1 border-t border-dashed border-black" />;
  return (
    <div className="mx-auto bg-white font-mono text-black" style={{ width: `${width - 6}mm`, fontSize: width === 58 ? "9px" : "11px", lineHeight: 1.3 }}>
      <style>{`@page { size: ${width}mm auto; margin: 3mm; } body { background: #fff; }`}</style>
      <div className="text-center">
        <p className="text-[1.3em] font-bold">CLÍNICA CELL</p>
        <p>{unit?.name}</p>
        <p>{unit?.phone}</p>
      </div>
      {hr}
      <p className="text-center text-[1.2em] font-bold">OS #{o.numero}</p>
      <p className="text-center">{new Date(o.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
      {hr}
      <p><b>Cliente:</b> {o.cliente_nome}</p>
      <p><b>Tel:</b> {o.cliente_telefone}</p>
      <p><b>Aparelho:</b> {[TIPOS_APARELHO.find((t) => t.value === o.tipo_aparelho)?.label, o.marca, o.modelo, o.cor].filter(Boolean).join(" · ")}</p>
      {naoDeixou.length > 0 && <p><b>Não deixou:</b> {naoDeixou.join(", ")}</p>}
      <p><b>Defeito:</b> {o.defeito || "—"}</p>
      {o.observacoes && <p><b>Obs:</b> {o.observacoes}</p>}
      {hr}
      {itens.map((i, k) => (
        <div key={k}>
          <p>{i.quantidade}x {i.discriminacao}</p>
          <p className="text-right">{formatBRL(itemTotal(i))}</p>
        </div>
      ))}
      <p className="flex justify-between text-[1.2em] font-bold"><span>TOTAL</span><span>{formatBRL(ordersTotal(itens))}</span></p>
      {hr}
      <p><b>Garantia:</b> {o.garantia_dias} dias</p>
      <p className="text-[0.85em]">Termos completos de garantia na via em PDF.</p>
      <p>{o.ciente_termos ? "[X]" : "[ ]"} Ciente dos termos de garantia</p>
      <p>{o.ciente_riscos ? "[X]" : "[ ]"} Ciente dos riscos de abertura</p>
      <div className="mt-8 border-t border-black pt-1 text-center">Cliente</div>
      <div className="mt-8 border-t border-black pt-1 text-center">Clínica Cell</div>
      <p className="mt-2 text-center">Obrigado pela preferência!</p>
    </div>
  );
}
