import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SignaturePad } from "@/components/admin/SignaturePad";
import { units } from "@/lib/units";
import { formatBRL } from "@/lib/products";
import {
  GARANTIA_OPCOES,
  NAO_DEIXOU,
  OS_BRANDS,
  TERMOS_PADRAO,
  TIPOS_APARELHO,
  itemTotal,
  ordersTotal,
  type OsItem,
} from "@/lib/service-orders";

const selectCls =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function ServiceOrderForm({ userId, onDone }: { userId: string; onDone: (id: string) => void }) {
  const [now] = useState(() => new Date());
  const [f, setF] = useState({
    loja: units[0].id,
    cliente_nome: "",
    cliente_telefone: "",
    tipo_aparelho: "celular",
    marca: "Apple",
    marca_outra: "",
    modelo: "",
    cor: "",
    quantidade: 1,
    defeito: "",
    observacoes: "",
    garantia_dias: 90,
    termos_garantia: TERMOS_PADRAO,
    ciente_termos: false,
  });
  const [naoDeixou, setNaoDeixou] = useState<string[]>([]);
  const [itens, setItens] = useState<OsItem[]>([{ quantidade: 1, discriminacao: "", preco_unitario: 0 }]);
  const [sigLoja, setSigLoja] = useState<string | null>(null);
  const [sigCliente, setSigCliente] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const setItem = (i: number, patch: Partial<OsItem>) =>
    setItens((arr) => arr.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.ciente_termos) return toast.error("Confirme que o cliente está ciente dos termos de garantia.");
    setBusy(true);
    const { marca_outra, ...rest } = f;
    const { data, error } = await supabase
      .from("service_orders")
      .insert({
        ...rest,
        marca: f.marca === "Outros" ? marca_outra || "Outros" : f.marca,
        nao_deixou: naoDeixou,
        itens: itens.filter((i) => i.discriminacao.trim()),
        assinatura_loja: sigLoja,
        assinatura_cliente: sigCliente,
        criado_por: userId,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Ordem de serviço criada.");
    onDone(data.id);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Emitida em {now.toLocaleDateString("pt-BR")} às{" "}
        {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Loja</Label>
          <select className={selectCls} value={f.loja} onChange={(e) => set("loja", e.target.value)}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Nome do cliente</Label>
          <Input required value={f.cliente_nome} onChange={(e) => set("cliente_nome", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Telefone para contato</Label>
          <Input required type="tel" value={f.cliente_telefone} onChange={(e) => set("cliente_telefone", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Tipo de aparelho</Label>
          <select className={selectCls} value={f.tipo_aparelho} onChange={(e) => set("tipo_aparelho", e.target.value)}>
            {TIPOS_APARELHO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Marca</Label>
          <select className={selectCls} value={f.marca} onChange={(e) => set("marca", e.target.value)}>
            {OS_BRANDS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          {f.marca === "Outros" && (
            <Input placeholder="Qual marca?" value={f.marca_outra} onChange={(e) => set("marca_outra", e.target.value)} />
          )}
        </div>
        <div className="space-y-2">
          <Label>Modelo</Label>
          <Input value={f.modelo} onChange={(e) => set("modelo", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Cor</Label>
          <Input value={f.cor} onChange={(e) => set("cor", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Quantidade de aparelhos</Label>
          <Input type="number" min={1} value={f.quantidade} onChange={(e) => set("quantidade", Math.max(1, Number(e.target.value)))} />
        </div>
      </div>

      <fieldset className="space-y-2">
        <Label>Não deixou</Label>
        <div className="flex flex-wrap gap-4">
          {NAO_DEIXOU.map((n) => (
            <label key={n.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={naoDeixou.includes(n.value)}
                onCheckedChange={(v) =>
                  setNaoDeixou((a) => (v ? [...a, n.value] : a.filter((x) => x !== n.value)))
                }
              />
              {n.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label>Defeito encontrado</Label>
        <Textarea value={f.defeito} onChange={(e) => set("defeito", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          placeholder="Ex.: cliente vai trocar o conector de carga, mas a tela está trincada."
          value={f.observacoes}
          onChange={(e) => set("observacoes", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Prestação de serviços</Label>
        <div className="space-y-2">
          {itens.map((it, i) => (
            <div key={i} className="grid grid-cols-[4rem_1fr_6rem_auto] items-center gap-2 sm:grid-cols-[4rem_1fr_7rem_7rem_auto]">
              <Input type="number" min={1} aria-label="Quantidade" value={it.quantidade} onChange={(e) => setItem(i, { quantidade: Math.max(1, Number(e.target.value)) })} />
              <Input placeholder="Discriminação" value={it.discriminacao} onChange={(e) => setItem(i, { discriminacao: e.target.value })} />
              <Input type="number" min={0} step="0.01" aria-label="Preço unitário" value={it.preco_unitario} onChange={(e) => setItem(i, { preco_unitario: Number(e.target.value) })} />
              <span className="hidden text-right text-sm font-medium sm:block">{formatBRL(itemTotal(it))}</span>
              <Button type="button" size="icon" variant="ghost" aria-label="Remover" onClick={() => setItens((a) => a.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={() => setItens((a) => [...a, { quantidade: 1, discriminacao: "", preco_unitario: 0 }])}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar linha
          </Button>
          <span className="font-semibold">Total: {formatBRL(ordersTotal(itens))}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Garantia</Label>
        <select className={selectCls} value={f.garantia_dias} onChange={(e) => set("garantia_dias", Number(e.target.value))}>
          {GARANTIA_OPCOES.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Termos de garantia</Label>
        <Textarea rows={8} value={f.termos_garantia} onChange={(e) => set("termos_garantia", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SignaturePad label="Assinatura Clínica Cell" onChange={setSigLoja} />
        <SignaturePad label="Assinatura do cliente" onChange={setSigCliente} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={f.ciente_termos} onCheckedChange={(v) => set("ciente_termos", !!v)} />
        Estou ciente dos termos de garantia
      </label>

      <Button type="submit" className="h-11 w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar ordem de serviço
      </Button>
    </form>
  );
}
