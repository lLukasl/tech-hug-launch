import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { SignaturePad } from "@/components/admin/SignaturePad";
import { formatBRL } from "@/lib/products";
import { unitById } from "@/lib/service-orders";
import { type SaleItem } from "@/lib/finance";
import { downloadFile, elementToPdf, sharePdf } from "@/lib/os-pdf";

export const Route = createFileRoute("/garantia/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Termo de Garantia — Clínica Cell" },
      { name: "description", content: "Termo de garantia e entrega de aparelho da Clínica Cell." },
      { property: "og:title", content: "Termo de Garantia — Clínica Cell" },
      { property: "og:description", content: "Termo de garantia e entrega de aparelho da Clínica Cell." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Warranty,
});

const CONDICOES = ["Novo", "Seminovo", "Usado"] as const;

const termos = (cond: string, dias: number) => `1. Prazo de cobertura: a Clínica Cell concede garantia de ${dias} dias a contar da data de entrega${cond === "Novo" ? ". Após esse período, a garantia restante é prestada pela rede autorizada do fabricante" : ", nos termos do Art. 26 do Código de Defesa do Consumidor"}.
2. Cobertura: defeitos de funcionamento do hardware que surjam com o uso normal do aparelho.
3. A garantia perde a validade em caso de:
a) quedas, trincas, quebra de tela/display, amassados ou outros danos físicos;
b) contato com água, líquidos, umidade ou sinais de oxidação;
c) violação de lacres ou intervenção técnica feita por terceiros;
d) danos por carregadores/acessórios não homologados ou oscilações de energia;
e) esquecimento de senhas ou bloqueio de contas (iCloud, Google, Samsung) após a entrega.
4. Bateria: desgaste natural da bateria não é considerado defeito.
5. Atendimento: apresente este termo e o aparelho na unidade de compra para análise técnica.
6. O cliente declara que recebeu o aparelho testado, funcionando e nas condições descritas acima.`;

function Warranty() {
  const { id } = Route.useParams();
  const docRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const { data: s, isLoading } = useQuery({
    queryKey: ["warranty", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const itens = ((s?.itens as SaleItem[]) ?? []).filter((i) => i.tipo !== "os");
  const [f, setF] = useState({ aparelho: "", imei: "", condicao: "Seminovo", bateria: "", dias: 90, acessorios: "" });
  const [sigLoja, setSigLoja] = useState<string | null>(null);
  const [sigCli, setSigCli] = useState<string | null>(null);
  const [ciente, setCiente] = useState(false);

  useEffect(() => {
    if (s && !f.aparelho) setF((p) => ({ ...p, aparelho: (itens.find((i) => i.tipo === "produto" || looksLikeDevice(i.descricao ?? "")) ?? itens[0])?.descricao ?? s.descricao }));
  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-primary" />;
  if (!s)
    return (
      <div className="mx-auto mt-20 max-w-sm text-center">
        <p>Venda não encontrada ou acesso restrito à equipe.</p>
        <Link to="/admin" className="mt-4 inline-block text-primary underline">Entrar no admin</Link>
      </div>
    );

  const unit = unitById(s.loja);
  const valor = itens.find((i) => i.descricao === f.aparelho)?.preco_unitario ?? Number(s.total);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const tel = s.cliente_telefone ?? "";
  const msg = [
    `Olá, ${s.cliente_nome || "cliente"}! Tudo bem?`,
    `Segue o Termo de Garantia do seu aparelho comprado na Clínica Cell${unit ? ` — ${unit.name}` : ""}.`,
    ``,
    `📱 Aparelho: ${f.aparelho}`,
    f.imei ? `🔢 IMEI: ${f.imei}` : "",
    `🛡️ Garantia: ${f.dias} dias`,
    ``,
    unit ? `Qualquer dúvida, fale com a gente: ${unit.phone}` : "",
  ].filter((l, i, a) => l !== "" || (a[i - 1] ?? "") !== "").join("\n");

  const gerar = async (modo: "share" | "download") => {
    if (!docRef.current) return;
    if (modo === "share" && tel.replace(/\D/g, "").length < 10) return toast.error("Telefone do cliente ausente ou inválido nesta venda.");
    setBusy(true);
    try {
      const file = await elementToPdf(docRef.current, `Garantia-${s.numero}.pdf`);
      if (modo === "download") return downloadFile(file);
      const r = await sharePdf(file, msg, tel);
      if (r === "downloaded") toast.success("PDF baixado e conversa aberta. Anexe o arquivo na conversa.", { duration: 10000 });
    } catch (e) {
      toast.error("Não foi possível gerar o PDF: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  return (
    <div className="mx-auto max-w-3xl p-4 text-sm text-foreground sm:p-6 print:p-0">
      <Toaster />
      <div className="mb-4 space-y-4 rounded-lg border border-border p-4 print:hidden">
        <h2 className="font-semibold">Dados do aparelho entregue</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>Aparelho</Label>
            {itens.length > 1 ? (
              <select className={sel} value={f.aparelho} onChange={(e) => set("aparelho", e.target.value)}>
                {itens.map((i, k) => <option key={k}>{i.descricao}</option>)}
              </select>
            ) : (
              <Input value={f.aparelho} onChange={(e) => set("aparelho", e.target.value)} />
            )}
          </div>
          <div className="space-y-1"><Label>IMEI / Nº de série (opcional)</Label><Input value={f.imei} onChange={(e) => set("imei", e.target.value)} /></div>
          <div className="space-y-1">
            <Label>Condição</Label>
            <select className={sel} value={f.condicao} onChange={(e) => { const c = e.target.value; setF((p) => ({ ...p, condicao: c, dias: c === "Novo" ? 365 : 90 })); }}>
              {CONDICOES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {f.condicao !== "Novo" && (
            <div className="space-y-1"><Label>Saúde da bateria (%)</Label><Input type="number" min={0} max={100} value={f.bateria} onChange={(e) => set("bateria", e.target.value)} /></div>
          )}
          <div className="space-y-1">
            <Label>Garantia</Label>
            <select className={sel} value={f.dias} onChange={(e) => set("dias", Number(e.target.value))}>
              {[90, 180, 365].map((d) => <option key={d} value={d}>{d === 365 ? "1 ano" : `${d} dias`}</option>)}
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2"><Label>Acessórios entregues</Label><Input placeholder="Ex.: cabo, caixa, película" value={f.acessorios} onChange={(e) => set("acessorios", e.target.value)} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SignaturePad label="Assinatura Clínica Cell" onChange={setSigLoja} />
          <SignaturePad label="Assinatura do cliente" onChange={setSigCli} />
        </div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={ciente} onChange={(e) => setCiente(e.target.checked)} /> Cliente ciente dos termos de garantia</label>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} className="bg-cta text-cta-foreground hover:bg-cta/90" onClick={() => gerar("share")}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />} Enviar PDF no WhatsApp
          </Button>
          <Button disabled={busy} variant="outline" onClick={() => gerar("download")}><Download className="mr-2 h-4 w-4" /> Baixar PDF</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
        </div>
      </div>

      <div ref={docRef} className="bg-background p-4">
        <header className="flex items-center gap-4 border-b border-border pb-4">
          <img src="/clinica-cell-logo.jpeg" alt="Clínica Cell" className="h-16 w-16" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">Clínica Cell</h1>
            <p className="text-muted-foreground">{unit?.name} · {unit?.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">Termo de Garantia</p>
            <p>Venda #{s.numero} · {new Date(s.created_at).toLocaleDateString("pt-BR")}</p>
          </div>
        </header>
        <section className="grid grid-cols-2 gap-2 border-b border-border py-4">
          <div><span className="text-muted-foreground">Cliente: </span><b>{s.cliente_nome || "—"}</b></div>
          <div><span className="text-muted-foreground">Telefone: </span><b>{tel || "—"}</b></div>
          <div className="col-span-2"><span className="text-muted-foreground">Aparelho: </span><b>{f.aparelho}</b></div>
          <div><span className="text-muted-foreground">IMEI/Série: </span><b>{f.imei || "—"}</b></div>
          <div><span className="text-muted-foreground">Condição: </span><b>{f.condicao}</b></div>
          {f.condicao !== "Novo" && <div><span className="text-muted-foreground">Bateria: </span><b>{f.bateria ? `${f.bateria}%` : "—"}</b></div>}
          <div><span className="text-muted-foreground">Valor: </span><b>{formatBRL(valor)}</b></div>
          <div><span className="text-muted-foreground">Garantia: </span><b>{f.dias === 365 ? "1 ano" : `${f.dias} dias`}</b></div>
          {f.acessorios && <div className="col-span-2"><span className="text-muted-foreground">Acessórios: </span><b>{f.acessorios}</b></div>}
        </section>
        <section className="py-4">
          <h2 className="mb-2 font-semibold">Condições da garantia</h2>
          <p className="whitespace-pre-line text-xs leading-relaxed">{termos(f.condicao, f.dias)}</p>
          <p className="mt-3">{ciente ? "☑" : "☐"} Estou ciente dos termos de garantia</p>
        </section>
        <section className="grid grid-cols-2 gap-8 pt-6">
          {([["Clínica Cell", sigLoja], ["Cliente", sigCli]] as const).map(([l, sg]) => (
            <div key={l} className="text-center">
              <div className="flex h-20 items-end justify-center">{sg && <img src={sg} alt={`Assinatura ${l}`} className="max-h-20" />}</div>
              <div className="border-t border-foreground pt-1">{l}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
