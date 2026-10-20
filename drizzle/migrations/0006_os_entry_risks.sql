ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS estado_entrada text NOT NULL DEFAULT 'ligando';
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS riscos text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS ciente_riscos boolean NOT NULL DEFAULT false;