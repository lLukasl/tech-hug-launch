import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const credsSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

/** Cria o superadmin inicial. Só funciona enquanto nenhum superadmin existir. */
export const bootstrapSuperadmin = createServerFn({ method: "POST" })
  .inputValidator((d) => credsSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "superadmin");
    if ((count ?? 0) > 0) throw new Error("O superadmin já foi criado.");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "Erro ao criar conta");
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "superadmin", email: data.email });
    return { ok: true };
  });

export const hasSuperadmin = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "superadmin");
  return { exists: (count ?? 0) > 0 };
});

async function assertManager(context: { supabase: { rpc: (fn: "is_manager", args: { _user_id: string }) => PromiseLike<{ data: unknown }> }; userId: string }) {
  const { data } = await context.supabase.rpc("is_manager", { _user_id: context.userId });
  if (!data) throw new Error("Acesso negado");
}

async function assertSuperadmin(context: { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "superadmin" }) => PromiseLike<{ data: unknown }> }; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "superadmin",
  });
  if (!data) throw new Error("Acesso negado");
}

export const createMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    credsSchema.extend({ role: z.enum(["member", "gerente"]).default("member") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.role === "gerente") await assertSuperadmin(context);
    else await assertManager(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "Erro ao criar conta");
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.role, email: data.email });
    return { ok: true };
  });

export const setMemberActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertManager(context);
    if (data.userId === context.userId)
      throw new Error("Você não pode desativar sua própria conta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!target || target.role === "superadmin") throw new Error("Conta não pode ser alterada.");
    if (target.role === "gerente") await assertSuperadmin(context);
    await supabaseAdmin
      .from("user_roles")
      .update({ active: data.active })
      .eq("user_id", data.userId);
    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.active ? "none" : "876000h",
    });
    return { ok: true };
  });
