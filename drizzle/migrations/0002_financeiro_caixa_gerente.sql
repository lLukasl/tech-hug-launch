ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerente';

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND active AND role::text IN ('superadmin','gerente')) $$;

CREATE TABLE public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja text NOT NULL,
  data date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  troco_inicial numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado')),
  aberto_por uuid,
  aberto_em timestamptz NOT NULL DEFAULT now(),
  dinheiro_contado numeric(10,2),
  foto_maquininha text,
  observacoes text,
  fechado_por uuid,
  fechado_em timestamptz,
  UNIQUE (loja, data)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_sessions TO authenticated;
GRANT ALL ON public.cash_sessions TO service_role;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read sessions" ON public.cash_sessions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff open sessions" ON public.cash_sessions FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND aberto_por = auth.uid());
CREATE POLICY "Staff close sessions" ON public.cash_sessions FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()) AND (status = 'aberto' OR public.is_manager(auth.uid()))) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Managers delete sessions" ON public.cash_sessions FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  loja text NOT NULL,
  vendedor_id uuid NOT NULL,
  vendedor_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  descricao text NOT NULL,
  origem text NOT NULL DEFAULT 'avulsa' CHECK (origem IN ('avulsa','produto','os')),
  product_id uuid,
  service_order_id uuid,
  pagamentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(10,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or manager read sales" ON public.sales FOR SELECT TO authenticated USING (vendedor_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "Staff insert own sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND vendedor_id = auth.uid());
CREATE POLICY "Managers update sales" ON public.sales FOR UPDATE TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));
CREATE POLICY "Own or manager delete sales" ON public.sales FOR DELETE TO authenticated USING (public.is_manager(auth.uid()) OR (vendedor_id = auth.uid() AND EXISTS (SELECT 1 FROM public.cash_sessions s WHERE s.id = session_id AND s.status = 'aberto')));

CREATE TABLE public.cash_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  valor numeric(10,2) NOT NULL CHECK (valor > 0),
  motivo text NOT NULL,
  criado_por uuid NOT NULL,
  criado_por_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_withdrawals TO authenticated;
GRANT ALL ON public.cash_withdrawals TO service_role;
ALTER TABLE public.cash_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or manager read withdrawals" ON public.cash_withdrawals FOR SELECT TO authenticated USING (criado_por = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "Staff insert withdrawals" ON public.cash_withdrawals FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND criado_por = auth.uid());
CREATE POLICY "Managers delete withdrawals" ON public.cash_withdrawals FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));

CREATE OR REPLACE FUNCTION public.session_totals(_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT jsonb_build_object(
    'credito', COALESCE(SUM(CASE WHEN p->>'forma'='credito' THEN (p->>'valor')::numeric END),0),
    'debito', COALESCE(SUM(CASE WHEN p->>'forma'='debito' THEN (p->>'valor')::numeric END),0),
    'pix', COALESCE(SUM(CASE WHEN p->>'forma'='pix' THEN (p->>'valor')::numeric END),0),
    'dinheiro', COALESCE(SUM(CASE WHEN p->>'forma'='dinheiro' THEN (p->>'valor')::numeric END),0),
    'vendas', (SELECT count(*) FROM public.sales WHERE session_id = _session_id),
    'sangrias', (SELECT COALESCE(SUM(valor),0) FROM public.cash_withdrawals WHERE session_id = _session_id)
  ) INTO r
  FROM public.sales s LEFT JOIN LATERAL jsonb_array_elements(s.pagamentos) p ON true
  WHERE s.session_id = _session_id;
  RETURN r;
END $$;

CREATE POLICY "Staff upload cash reports" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cash-reports' AND public.is_staff(auth.uid()));
CREATE POLICY "Managers read cash reports" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cash-reports' AND (public.is_manager(auth.uid()) OR owner = auth.uid()));
CREATE POLICY "Managers delete cash reports" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cash-reports' AND public.is_manager(auth.uid()));