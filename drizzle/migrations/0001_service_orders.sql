CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  loja text NOT NULL,
  cliente_nome text NOT NULL,
  cliente_telefone text NOT NULL,
  tipo_aparelho text NOT NULL DEFAULT 'celular',
  marca text,
  modelo text,
  cor text,
  quantidade integer NOT NULL DEFAULT 1,
  nao_deixou text[] NOT NULL DEFAULT '{}',
  defeito text,
  observacoes text,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  garantia_dias integer NOT NULL DEFAULT 90,
  termos_garantia text,
  ciente_termos boolean NOT NULL DEFAULT false,
  assinatura_loja text,
  assinatura_cliente text,
  status text NOT NULL DEFAULT 'aberta',
  criado_por uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.service_orders_numero_seq TO authenticated;
GRANT ALL ON public.service_orders TO service_role;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read orders" ON public.service_orders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff insert orders" ON public.service_orders FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update orders" ON public.service_orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete orders" ON public.service_orders FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));