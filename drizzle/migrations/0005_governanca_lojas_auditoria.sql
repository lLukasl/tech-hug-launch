ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS loja text;
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS cancel_motivo text,
  ADD COLUMN IF NOT EXISTS cancel_obs text,
  ADD COLUMN IF NOT EXISTS cancelado_por uuid,
  ADD COLUMN IF NOT EXISTS cancelado_por_email text,
  ADD COLUMN IF NOT EXISTS cancelado_em timestamptz;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND active AND role::text IN ('superadmin','gerente','supervisor')) $$;

CREATE OR REPLACE FUNCTION public.is_global(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND active AND role::text IN ('superadmin','supervisor')) $$;

CREATE OR REPLACE FUNCTION public.user_loja(_user_id uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT loja FROM public.user_roles WHERE user_id = _user_id AND active LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.can_manage_loja(_user_id uuid, _loja text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.is_global(_user_id) OR (public.is_manager(_user_id) AND public.user_loja(_user_id) = _loja) $$;

CREATE OR REPLACE FUNCTION public.can_sell_loja(_user_id uuid, _loja text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.is_global(_user_id) OR (public.is_staff(_user_id) AND public.user_loja(_user_id) = _loja) $$;

-- Caixa: só gerente (da loja) ou global abre/fecha
DROP POLICY IF EXISTS "Staff open sessions" ON public.cash_sessions;
DROP POLICY IF EXISTS "Staff close sessions" ON public.cash_sessions;
CREATE POLICY "Managers open sessions" ON public.cash_sessions FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_loja(auth.uid(), loja) AND aberto_por = auth.uid());
CREATE POLICY "Managers update sessions" ON public.cash_sessions FOR UPDATE TO authenticated
  USING (public.can_manage_loja(auth.uid(), loja)) WITH CHECK (public.can_manage_loja(auth.uid(), loja));

-- Vendas: vendedor só lança na sua loja; gerente vê só a sua loja
DROP POLICY IF EXISTS "Staff insert own sales" ON public.sales;
DROP POLICY IF EXISTS "Own or manager read sales" ON public.sales;
DROP POLICY IF EXISTS "Managers update sales" ON public.sales;
DROP POLICY IF EXISTS "Own or manager delete sales" ON public.sales;
CREATE POLICY "Staff insert own sales" ON public.sales FOR INSERT TO authenticated
  WITH CHECK (public.can_sell_loja(auth.uid(), loja) AND vendedor_id = auth.uid());
CREATE POLICY "Own or manager read sales" ON public.sales FOR SELECT TO authenticated
  USING (vendedor_id = auth.uid() OR public.can_manage_loja(auth.uid(), loja));
CREATE POLICY "Managers update sales" ON public.sales FOR UPDATE TO authenticated
  USING (public.can_manage_loja(auth.uid(), loja)) WITH CHECK (public.can_manage_loja(auth.uid(), loja));
CREATE POLICY "Own or manager delete sales" ON public.sales FOR DELETE TO authenticated
  USING (public.can_manage_loja(auth.uid(), loja) OR (vendedor_id = auth.uid() AND EXISTS (SELECT 1 FROM public.cash_sessions s WHERE s.id = sales.session_id AND s.status = 'aberto')));

-- OS: exclusão física só global; cancelamento é via update
DROP POLICY IF EXISTS "Staff delete orders" ON public.service_orders;
CREATE POLICY "Global delete orders" ON public.service_orders FOR DELETE TO authenticated USING (public.is_global(auth.uid()));