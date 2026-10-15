CREATE SEQUENCE IF NOT EXISTS public.sales_numero_seq;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS numero integer NOT NULL DEFAULT nextval('public.sales_numero_seq');
ALTER SEQUENCE public.sales_numero_seq OWNED BY public.sales.numero;
GRANT USAGE, SELECT ON SEQUENCE public.sales_numero_seq TO authenticated;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS itens jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS cliente_nome text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS cliente_telefone text;