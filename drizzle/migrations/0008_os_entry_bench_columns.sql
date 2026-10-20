ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS estado_entrada text NOT NULL DEFAULT 'ligando',
  ADD COLUMN IF NOT EXISTS riscos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ciente_riscos boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS localizacao text NOT NULL DEFAULT 'loja',
  ADD COLUMN IF NOT EXISTS responsavel text,
  ADD COLUMN IF NOT EXISTS placa_status text,
  ADD COLUMN IF NOT EXISTS placa_valor numeric,
  ADD COLUMN IF NOT EXISTS placa_aprovado boolean,
  ADD COLUMN IF NOT EXISTS historico_tecnico jsonb NOT NULL DEFAULT '[]'::jsonb;