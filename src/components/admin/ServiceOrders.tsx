import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, Plus, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServiceOrderForm } from "@/components/admin/ServiceOrderForm";
import { units } from "@/lib/units";
import { OS_STATUS, shareOsLink, unitById, type OsStatus } from "@/lib/service-orders";

type Row = { id: string; numero: number; created_at: string; loja: string; cliente_nome: string; modelo: string | null; marca: string | null; status: string };

export function ServiceOrders({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState<Row | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["service-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("id, numero, created_at, loja, cliente_nome, modelo, marca, status")
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
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Ordens de serviço</h1>
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Ordem de Serviço
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-primary" />
      ) : !data?.length ? (
        <p className="mt-10 text-center text-muted-foreground">Nenhuma ordem de serviço ainda.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">OS #{o.numero} — {o.cliente_nome}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} ·{" "}
                  {unitById(o.loja)?.shortName ?? o.loja} · {[o.marca, o.modelo].filter(Boolean).join(" ")}
                </p>
              </div>
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={o.status}
                onChange={(e) => setStatus(o.id, e.target.value as OsStatus)}
              >
                {OS_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" asChild>
                <Link to="/os/$id" params={{ id: o.id }} target="_blank">
                  <Printer className="mr-1 h-4 w-4" /> Imprimir / PDF
                </Link>
              </Button>
              <Button size="sm" className="bg-cta text-cta-foreground hover:bg-cta/90" onClick={() => setSharing(o)}>
                <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova ordem de serviço</DialogTitle>
          </DialogHeader>
          {creating && (
            <ServiceOrderForm
              userId={userId}
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
    </>
  );
}
