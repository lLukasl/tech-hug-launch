import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, LogOut, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductForm } from "@/components/admin/ProductForm";
import { ServiceOrders } from "@/components/admin/ServiceOrders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PHOTO_BUCKET,
  condicaoLabel,
  fetchProducts,
  formatBRL,
  fullName,
  type ProductWithUrls,
} from "@/lib/products";
import {
  bootstrapSuperadmin,
  createMember,
  hasSuperadmin,
  setMemberActive,
} from "@/lib/admin.functions";

const logo = "/clinica-cell-logo.jpeg";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Área administrativa — Clínica Cell" },
      { name: "description", content: "Gerenciamento do encarte digital da Clínica Cell." },
      { property: "og:title", content: "Área administrativa — Clínica Cell" },
      { property: "og:description", content: "Gerenciamento do encarte digital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Role = "superadmin" | "member";

function AdminPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "out" | { userId: string; role: Role }>("loading");

  const resolve = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return setState("out");
    const { data: r } = await supabase
      .from("user_roles")
      .select("role, active")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!r || !r.active) {
      await supabase.auth.signOut();
      toast.error("Acesso não autorizado.");
      navigate({ to: "/", replace: true });
      return;
    }
    setState({ userId: data.user.id, role: r.role as Role });
  };

  useEffect(() => {
    resolve();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") resolve();
    });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Clínica Cell" className="h-auto w-10" />
            <span className="font-display text-lg font-bold">
              Clínica<span className="text-primary">Cell</span>
            </span>
          </Link>
          <span className="text-sm text-muted-foreground">Admin</span>
          {typeof state === "object" && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/", replace: true });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {state === "loading" && <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />}
        {state === "out" && <LoginForm />}
        {typeof state === "object" && (
          <Tabs defaultValue="produtos">
            <TabsList className="mb-6">
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="os">Ordens de Serviço</TabsTrigger>
            </TabsList>
            <TabsContent value="produtos">
              <Dashboard role={state.role} userId={state.userId} />
            </TabsContent>
            <TabsContent value="os">
              <ServiceOrders userId={state.userId} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const checkSuper = useServerFn(hasSuperadmin);
  const bootstrap = useServerFn(bootstrapSuperadmin);
  const { data: sa } = useQuery({ queryKey: ["has-superadmin"], queryFn: () => checkSuper() });
  const isSetup = sa && !sa.exists;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSetup) {
        if (password.length < 8) throw new Error("A senha deve ter ao menos 8 caracteres.");
        await bootstrap({ data: { email, password } });
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("E-mail ou senha inválidos.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-6 shadow-card">
      <h1 className="text-2xl font-bold">{isSetup ? "Criar conta do superadmin" : "Entrar"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isSetup
          ? "Primeiro acesso: defina o e-mail e a senha do administrador principal."
          : "Acesso restrito à equipe Clínica Cell."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete={isSetup ? "new-password" : "current-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSetup ? "Criar e entrar" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}

function Dashboard({ role, userId }: { role: Role; userId: string }) {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const [editing, setEditing] = useState<ProductWithUrls | "new" | null>(null);
  const [deleting, setDeleting] = useState<ProductWithUrls | null>(null);
  const [showTeam, setShowTeam] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["products"] });

  const toggleSold = async (p: ProductWithUrls) => {
    const status = p.status === "vendido" ? "disponivel" : "vendido";
    const { error } = await supabase.from("products").update({ status }).eq("id", p.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("products").delete().eq("id", deleting.id);
    if (error) return toast.error(error.message);
    if (deleting.fotos.length) await supabase.storage.from(PHOTO_BUCKET).remove(deleting.fotos);
    toast.success("Produto excluído.");
    setDeleting(null);
    refresh();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Produtos do encarte</h1>
        <div className="ml-auto flex gap-2">
          {role === "superadmin" && (
            <Button variant="outline" onClick={() => setShowTeam(true)}>
              <Users className="mr-2 h-4 w-4" /> Equipe
            </Button>
          )}
          <Button onClick={() => setEditing("new")}>
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-primary" />
      ) : !products?.length ? (
        <p className="mt-10 text-center text-muted-foreground">Nenhum produto cadastrado ainda.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-card"
            >
              <div className="aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.fotoUrls[0] && (
                  <img src={p.fotoUrls[0]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate font-semibold">{fullName(p)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatBRL(p.preco)}
                  {p.condicao && ` · ${condicaoLabel[p.condicao]}`}
                </p>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <Switch checked={p.status === "vendido"} onCheckedChange={() => toggleSold(p)} />
                  {p.status === "vendido" ? "Vendido" : "Disponível"}
                </label>
                <div className="mt-auto flex gap-1 pt-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                    <Pencil className="mr-1 h-4 w-4" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setDeleting(p)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Excluir
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Novo Produto" : "Editar produto"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <ProductForm
              initial={editing === "new" ? undefined : editing}
              onDone={() => {
                setEditing(null);
                refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {role === "superadmin" && (
        <Dialog open={showTeam} onOpenChange={setShowTeam}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Equipe</DialogTitle>
            </DialogHeader>
            <TeamManager selfId={userId} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function TeamManager({ selfId }: { selfId: string }) {
  const qc = useQueryClient();
  const create = useServerFn(createMember);
  const setActive = useServerFn(setMemberActive);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, email, role, active")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const memberCount = members?.filter((m) => m.role === "member").length ?? 0;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: { email, password } });
      toast.success("Conta criada.");
      setEmail("");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["members"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {members?.map((m) => (
          <li
            key={m.user_id}
            className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{m.email}</p>
              <p className="text-xs text-muted-foreground">
                {m.role === "superadmin" ? "Superadmin" : "Membro"}
              </p>
            </div>
            {m.user_id !== selfId && (
              <label className="flex items-center gap-2">
                <Switch
                  checked={m.active}
                  onCheckedChange={async (v) => {
                    try {
                      await setActive({ data: { userId: m.user_id, active: v } });
                      qc.invalidateQueries({ queryKey: ["members"] });
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Erro.");
                    }
                  }}
                />
                {m.active ? "Ativo" : "Desativado"}
              </label>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="space-y-3 border-t border-border pt-4">
        <p className="text-sm font-semibold">Adicionar membro ({memberCount} cadastrados)</p>
        <Input
          type="email"
          placeholder="E-mail"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Senha (mín. 8 caracteres)"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={busy} className="w-full">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar conta
        </Button>
      </form>
    </div>
  );
}
