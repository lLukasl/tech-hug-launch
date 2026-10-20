import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatBRL } from "@/lib/products";
import { Copy, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LOCALIZACOES, PLACA_STATUS, labelOf, laudoClienteMsg, ordersTotal, applyBenchToItems, PLACA_ITEM, itemTotal, unitById, type BenchLog, type OsItem } from "@/lib/service-orders";

const fsel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

type Props = { orderId: string | null; email: string; onClose: () => void; onSaved: () => void };

export function BenchDialog({ orderId, email, onClose, onSaved }: Props) {
  const { data: o, isLoading, refetch } = useQuery({
    queryKey: ["os-bench", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("id, numero, cliente_nome, cliente_telefone, modelo, localizacao, responsavel, placa_status, placa_valor, placa_aprovado, historico_tecnico, marca, defeito, servicos_realizados, garantia_dias, loja, itens")
        .eq("id", orderId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const [local, setLocal] = useState("loja");
  const [resp, setResp] = useState("");
  const [status, setStatus] = useState("");
  const [valor, setValor] = useState("");
  const [aprov, setAprov] = useState("");
  const [nota, setNota] = useState("");
  const [realizados, setRealizados] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [disp, setDisp] = useState<number[]>([]);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (!o) return;
    setLocal(o.localizacao);
    setResp(o.responsavel ?? "");
    setStatus(o.placa_status ?? "");
    setValor(o.placa_valor != null ? String(o.placa_valor) : "");
    setAprov(o.placa_aprovado == null ? "" : o.placa_aprovado ? "sim" : "nao");
    setNota("");
    setRealizados(o.servicos_realizados ?? "");
    setMsg("");
    setDisp([]);
    setMotivo("");
  }, [o]);

  const logs = (o?.historico_tecnico as BenchLog[] | undefined) ?? [];
  const itensAtuais = (o?.itens as OsItem[] | undefined) ?? [];
  const valorNum = valor ? Number(valor.replace(",", ".")) || null : null;
  const aprovBool = aprov === "" ? null : aprov === "sim";
  const novosItens = applyBenchToItems(itensAtuais, disp, valorNum, aprovBool);
  const toggleDisp = (k: number) => setDisp((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));

  const save = async () => {
    if (!o) return;
    if (disp.length && !motivo.trim()) return toast.error("Explique por que o serviço inicial não foi necessário.");
    const itensMudaram = JSON.stringify(novosItens) !== JSON.stringify(itensAtuais);
    const changed = itensMudaram || realizados !== (o.servicos_realizados ?? "") || local !== o.localizacao || resp !== (o.responsavel ?? "") || status !== (o.placa_status ?? "");
    if (!nota.trim() && !changed) return toast.error("Descreva o que foi feito ou altere a localização/status.");
    setBusy(true);
    const dispTxt = disp.length ? `Serviço inicial dispensado: ${disp.map((k) => itensAtuais[k]?.discriminacao).join(", ")} (${formatBRL(disp.reduce((s, k) => s + itemTotal(itensAtuais[k]), 0))}). Motivo: ${motivo.trim()}` : "";
    const texto = [nota.trim(), dispTxt].filter(Boolean).join(" | ");
    const entry: BenchLog = { at: new Date().toISOString(), by: email, texto, local, status: status || null, responsavel: resp || null };
    const { error } = await supabase
      .from("service_orders")
      .update({
        localizacao: local,
        responsavel: resp.trim() || null,
        placa_status: status || null,
        placa_valor: valor ? Number(valor.replace(",", ".")) : null,
        placa_aprovado: aprov === "" ? null : aprov === "sim",
        servicos_realizados: realizados.trim() || null,
        itens: novosItens,
        historico_tecnico: texto || itensMudaram || local !== o.localizacao || status !== (o.placa_status ?? "") ? [...logs, entry] : logs,
      })
      .eq("id", o.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Registro salvo.");
    await refetch();
    onSaved();
  };

  const gerarMsg = () => {
    if (!o) return;
    const u = unitById(o.loja);
    setMsg(laudoClienteMsg({
      numero: o.numero, cliente_nome: o.cliente_nome, marca: o.marca, modelo: o.modelo, defeito: o.defeito,
      servicos_realizados: realizados.trim() || null,
      placa_status_label: status ? labelOf(PLACA_STATUS, status) : null,
      valor: valor ? Number(valor.replace(",", ".")) : null,
      total: ordersTotal(novosItens), garantia_dias: o.garantia_dias,
      loja_nome: u?.name, loja_tel: u?.phone,
    }));
  };
  const copiar = async () => { await navigator.clipboard.writeText(msg); toast.success("Mensagem copiada — cole no WhatsApp do cliente."); };
  const wa = o ? `https://wa.me/55${o.cliente_telefone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}` : "#";

  return (
    <Dialog open={!!orderId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bancada / Placa — OS #{o?.numero}</DialogTitle>
        </DialogHeader>
        {isLoading || !o ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Onde o aparelho está</Label>
                <select className={fsel} value={local} onChange={(e) => setLocal(e.target.value)}>
                  {LOCALIZACOES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Com quem está</Label>
                <Input value={resp} onChange={(e) => setResp(e.target.value)} placeholder="Ex.: Técnico Marcos" />
              </div>
              <div className="space-y-1">
                <Label>Status de placa</Label>
                <select className={fsel} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Sem problema de placa</option>
                  {PLACA_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Valor do reparo de placa (R$)</Label>
                <Input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-1">
                <Label>Cliente aprovou?</Label>
                <select className={fsel} value={aprov} onChange={(e) => setAprov(e.target.value)}>
                  <option value="">Aguardando resposta</option>
                  <option value="sim">Sim, aprovou</option>
                  <option value="nao">Não aprovou</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={gerarMsg}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Gerar mensagem para o cliente
                </Button>
              </div>
            </div>
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <Label>O serviço inicial foi realmente necessário?</Label>
              <p className="text-xs text-muted-foreground">Ex.: a tela não ligava, mas após o reparo de placa a tela original voltou. Marque o que não será mais cobrado.</p>
              {itensAtuais.filter((i) => i.discriminacao !== PLACA_ITEM).length === 0 && <p className="text-sm text-muted-foreground">Nenhum serviço inicial na OS.</p>}
              {itensAtuais.map((i, k) => i.discriminacao === PLACA_ITEM ? null : (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={disp.includes(k)} onChange={() => toggleDisp(k)} />
                  <span className={disp.includes(k) ? "line-through text-muted-foreground" : ""}>{i.quantidade}x {i.discriminacao} — {formatBRL(itemTotal(i))}</span>
                  {disp.includes(k) && <span className="text-xs font-semibold text-primary">Não necessário</span>}
                </label>
              ))}
              {disp.length > 0 && <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (ex.: tela original voltou após reparo de placa)" />}
              <div className="flex justify-between border-t border-border pt-2 text-sm">
                <span>Total atual: {formatBRL(ordersTotal(itensAtuais))}</span>
                <span className="font-bold">Novo total da OS: {formatBRL(ordersTotal(novosItens))}</span>
              </div>
              {aprov === "nao" && valorNum ? <p className="text-xs text-muted-foreground">Cliente não aprovou: reparo de placa não entra no total.</p> : null}
            </div>
            {msg && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <Label>Mensagem para encaminhar ao cliente (pode editar)</Label>
                <Textarea rows={9} value={msg} onChange={(e) => setMsg(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={copiar}><Copy className="mr-2 h-4 w-4" /> Copiar mensagem</Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> Abrir WhatsApp do cliente</a>
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label>Serviços realizados (aparece no PDF do cliente)</Label>
              <Textarea rows={2} value={realizados} onChange={(e) => setRealizados(e.target.value)} placeholder="Ex.: Substituição do conector de carga e limpeza interna." />
            </div>
            <div className="space-y-1">
              <Label>Anotação técnica interna (não vai para o cliente)</Label>
              <Textarea rows={3} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex.: Trocada tela e bateria, sem imagem. Curto na linha principal, enviado ao laboratório." />
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar registro
              </Button>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Histórico técnico</h3>
              {!logs.length ? (
                <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
              ) : (
                <ol className="space-y-2">
                  {[...logs].reverse().map((l, i) => (
                    <li key={i} className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                      <p className="text-xs text-muted-foreground">
                        {new Date(l.at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {l.by} ·{" "}
                        {labelOf(LOCALIZACOES, l.local)}{l.responsavel ? ` (${l.responsavel})` : ""}
                        {l.status ? ` · ${labelOf(PLACA_STATUS, l.status)}` : ""}
                      </p>
                      {l.texto && <p className="mt-1">{l.texto}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
