ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS localizacao text NOT NULL DEFAULT 'loja',
  ADD COLUMN IF NOT EXISTS responsavel text,
  ADD COLUMN IF NOT EXISTS placa_status text,
  ADD COLUMN IF NOT EXISTS placa_valor numeric,
  ADD COLUMN IF NOT EXISTS placa_aprovado boolean,
  ADD COLUMN IF NOT EXISTS historico_tecnico jsonb NOT NULL DEFAULT '[]'::jsonb;