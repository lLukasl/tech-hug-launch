CREATE TYPE public.app_role AS ENUM ('superadmin', 'member');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  email text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role AND active)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND active)
$$;

CREATE POLICY "Users read own role" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria text NOT NULL CHECK (categoria IN ('celular','acessorio')),
  nome text NOT NULL,
  marca text,
  modelo text,
  armazenamento text,
  cor text,
  condicao text CHECK (condicao IN ('novo','seminovo','usado')),
  bateria integer CHECK (bateria IS NULL OR (bateria >= 0 AND bateria <= 100)),
  compativel text,
  preco numeric(10,2) NOT NULL CHECK (preco >= 0),
  fotos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel','vendido')),
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update products" ON public.products FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete products" ON public.products FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Public read product photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-photos');
CREATE POLICY "Staff upload product photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update product photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete product photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-photos' AND public.is_staff(auth.uid()));