import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Cpu, Loader2, MessageCircle, Plus, Printer, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServiceOrderForm } from "@/components/admin/ServiceOrderForm";
import { units } from "@/lib/units";
import { CANCEL_MOTIVOS, LOCALIZACOES, OS_STATUS, PLACA_STATUS, diasParado, labelOf, shareOsLink, unitById, type BenchLog, type OsStatus } from "@/lib/service-orders";
import { BenchDialog } from "@/components/admin/BenchDialog";

const fsel = "h-10 rounded-md border border-input bg-background px-3 text-sm";
type Row = { id: string; numero: number; created_at: string; loja: string; cliente_nome: string; modelo: string | null; marca: string | null; status: string; localizacao?: string; responsavel?: string | null; placa_status?: string | null; historico_tecnico?: unknown };

type Props = { userId: string; email: string; userLoja: string | null; userLojas?: string[]; isGlobal: boolean; isManager: boolean };

export function ServiceOrders({ userId, email, userLoja, userLojas, isGlobal, isManager }: Props) {
  const qc = useQueryClient();
  const lojaUnits = isGlobal ? units : units.filter((u) => (userLojas?.length ? userLojas : [userLoja]).includes(u.id));
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState<Row | null>(null);
  const [canceling, setCanceling] = useState<Row | null>(null);
  const [fLoja, setFLoja] = useState(isGlobal ? "" : (userLoja ?? ""));
  const [fStatus, setFStatus] = useState("");
  const [q, setQ] = useState("");
  const [fPlaca, setFPlaca] = useState("");
  const [bench, setBench] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["service-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("id, numero, created_at, loja, cliente_nome, modelo, marca, status, localizacao, responsavel, placa_status, historico_tecnico")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["service-orders"] });

  const setStatus = async (id: string, status: OsStatus) => {
    const { error } = await supabase.from("service_orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold">Ordens de serviço</h1>
        <Button className="w-full sm:ml-auto sm:w-auto" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Ordem de Serviço
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {lojaUnits.length > 1 ? (
          <select className={`${fsel} w-full`} value={fLoja} onChange={(e) => setFLoja(e.target.value)}>
            {isGlobal && <option value="">Todas as lojas</option>}
            {lojaUnits.map((u) => <option key={u.id} value={u.id}>{u.shortName}</option>)}
          </select>
        ) : (
          <p className={`${fsel} flex items-center bg-muted/40 font-medium`}>
            {unitById(fLoja)?.shortName ?? fLoja}
          </p>
        )}
        <select className={`${fsel} w-full`} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {OS_STATUS.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
        </select>
        <select className={`${fsel} w-full`} value={fPlaca} onChange={(e) => setFPlaca(e.target.value)}>
          <option value="">Placa: todas</option>
          <option value="__any">Somente bancada de placa</option>
          {PLACA_STATUS.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
        </select>
        <input className={`${fsel} w-full min-w-0`} placeholder="Buscar nº ou cliente" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-primary" />
      ) : !data?.length ? (
        <p className="mt-10 text-center text-muted-foreground">Nenhuma ordem de serviço ainda.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data
            .filter((o) => (!fLoja || o.loja === fLoja) && (!fStatus || o.status === fStatus) && (!fPlaca || (fPlaca === "__any" ? !!o.placa_status : o.placa_status === fPlaca)) && (!q || String(o.numero) === q.replace("#", "").trim() || o.cliente_nome.toLowerCase().includes(q.toLowerCase())))
            .map((o) => (
            <li key={o.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold">OS #{o.numero} — {o.cliente_nome}</p>
                <p className="break-words text-sm text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} ·{" "}
                  {unitById(o.loja)?.shortName ?? o.loja} · {[o.marca, o.modelo].filter(Boolean).join(" ")}
                </p>
                {(o.placa_status || (o.localizacao && o.localizacao !== "loja")) && (() => {
                  const d = diasParado(o.created_at, (o.historico_tecnico as BenchLog[]) ?? []);
                  return (
                    <p className="mt-1 flex flex-wrap gap-1 text-xs">
                      <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
                        📍 {labelOf(LOCALIZACOES, o.localizacao)}{o.responsavel ? ` · ${o.responsavel}` : ""}
                      </span>
                      {o.placa_status && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{labelOf(PLACA_STATUS, o.placa_status)}</span>}
                      {d >= 2 && <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">Parado há {d} dias</span>}
                    </p>
                  );
                })()}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:shrink-0 lg:flex-wrap lg:items-center">
                <select
                  className="col-span-2 h-9 w-full rounded-md border border-input bg-background px-2 text-sm sm:col-span-3 lg:w-auto"
                  value={o.status}
                  onChange={(e) => setStatus(o.id, e.target.value as OsStatus)}
                  disabled={o.status === "cancelada"}
                >
                  {OS_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <Button size="sm" variant="outline" onClick={() => setBench(o.id)}>
                  <Cpu className="mr-1 h-4 w-4" /> Bancada
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/os/$id" params={{ id: o.id }} target="_blank">
                    <Printer className="mr-1 h-4 w-4" /> PDF
                  </Link>
                </Button>
                <Button size="sm" className="bg-cta text-cta-foreground hover:bg-cta/90" onClick={() => setSharing(o)}>
                  <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
                </Button>
                {o.status !== "cancelada" && o.status !== "entregue" && (
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setCanceling(o)}>
                    <XCircle className="mr-1 h-4 w-4" /> Cancelar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1rem)] max-w-3xl overflow-y-auto p-4 pb-0 sm:p-6 sm:pb-0">
          <DialogHeader>
            <DialogTitle>Nova ordem de serviço</DialogTitle>
          </DialogHeader>
          {creating && (
            <ServiceOrderForm
              userId={userId}
              email={email}
              userLoja={userLoja}
              isGlobal={isGlobal}
              userLojas={userLojas}
              onCancel={() => setCreating(false)}
              onDone={async (id) => {
                setCreating(false);
                await refresh();
                const { data: row } = await supabase
                  .from("service_orders")
                  .select("id, numero, created_at, loja, cliente_nome, modelo, marca, status")
                  .eq("id", id)
                  .single();
                if (row) setSharing(row as Row);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!sharing} onOpenChange={(o) => !o && setSharing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar OS #{sharing?.numero} por WhatsApp</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Escolha o número da loja que vai receber o link da ordem (para abrir, salvar em PDF e repassar ao cliente).
          </p>
          <div className="grid gap-2">
            {sharing &&
              units.map((u) => (
                <Button key={u.id} variant="outline" className="justify-between" asChild>
                  <a
                    href={shareOsLink({
                      unitId: u.id,
                      numero: sharing.numero,
                      cliente: sharing.cliente_nome,
                      url: `${window.location.origin}/os/${sharing.id}`,
                    })}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{u.name}</span>
                    <span className="text-muted-foreground">{u.phone}</span>
                  </a>
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      <BenchDialog orderId={bench} email={email} onClose={() => setBench(null)} onSaved={refresh} />

      <CancelDialog
        order={canceling}
        userId={userId}
        email={email}
        onClose={() => setCanceling(null)}
        onDone={() => {
          setCanceling(null);
          refresh();
          qc.invalidateQueries({ queryKey: ["os-audit"] });
        }}
      />
    </>
  );
}

function CancelDialog({ order, userId, email, onClose, onDone }: { order: Row | null; userId: string; email: string; onClose: () => void; onDone: () => void }) {
  const [motivo, setMotivo] = useState(CANCEL_MOTIVOS[0]);
  const [obs, setObs] = useState("");
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!order) return;
    if (motivo === "Outro" && !obs.trim()) return toast.error("Descreva o motivo do cancelamento.");
    setBusy(true);
    const { error } = await supabase
      .from("service_orders")
      .update({
        status: "cancelada",
        cancel_motivo: motivo,
        cancel_obs: obs.trim() || null,
        cancelado_por: userId,
        cancelado_por_email: email,
        cancelado_em: new Date().toISOString(),
      })
      .eq("id", order.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`OS #${order.numero} cancelada.`);
    setObs("");
    setMotivo(CANCEL_MOTIVOS[0]);
    onDone();
  };

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar OS #{order?.numero}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Motivo do cancelamento</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              {CANCEL_MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Observações {motivo === "Outro" ? "(obrigatório)" : "(opcional)"}</Label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Detalhes para auditoria interna…" rows={3} />
          </div>
          <p className="text-xs text-muted-foreground">
            O cancelamento fica registrado com seu usuário, data e motivo para auditoria.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Voltar</Button>
            <Button variant="destructive" onClick={confirm} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmar cancelamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AuditRow = {
  id: string;
  numero: number;
  loja: string;
  cliente_nome: string;
  cancel_motivo: string | null;
  cancel_obs: string | null;
  cancelado_por_email: string | null;
  cancelado_em: string | null;
};

export function OsAudit({ userLoja, userLojas, isGlobal }: { userLoja: string | null; userLojas?: string[]; isGlobal: boolean }) {
  const lojaUnits = isGlobal ? units : units.filter((u) => (userLojas?.length ? userLojas : [userLoja]).includes(u.id));
  const [fLoja, setFLoja] = useState(isGlobal ? "" : (userLoja ?? ""));
  const [fMotivo, setFMotivo] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["os-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("id, numero, loja, cliente_nome, cancel_motivo, cancel_obs, cancelado_por_email, cancelado_em")
        .eq("status", "cancelada")
        .order("cancelado_em", { ascending: false });
      if (error) throw error;
      return data as AuditRow[];
    },
  });

  const list = (data ?? []).filter(
    (o) => (!fLoja || o.loja === fLoja) && (!fMotivo || o.cancel_motivo === fMotivo),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Auditoria de cancelamentos</h1>
        {lojaUnits.length > 1 && (
          <select className={fsel} value={fLoja} onChange={(e) => setFLoja(e.target.value)}>
            {isGlobal && <option value="">Todas as lojas</option>}
            {lojaUnits.map((u) => <option key={u.id} value={u.id}>{u.shortName}</option>)}
          </select>
        )}
        <select className={fsel} value={fMotivo} onChange={(e) => setFMotivo(e.target.value)}>
          <option value="">Todos os motivos</option>
          {CANCEL_MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-primary" />
      ) : !list.length ? (
        <p className="text-sm text-muted-foreground">Nenhuma ordem cancelada.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((o) => (
            <li key={o.id} className="rounded-xl border border-border bg-card p-4 text-sm shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">OS #{o.numero} — {o.cliente_nome}</p>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                  {o.cancel_motivo}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {unitById(o.loja)?.shortName ?? o.loja} · Cancelada por {o.cancelado_por_email ?? "—"} em{" "}
                {o.cancelado_em ? new Date(o.cancelado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}
              </p>
              {o.cancel_obs && <p className="mt-2 text-sm">Obs.: {o.cancel_obs}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
