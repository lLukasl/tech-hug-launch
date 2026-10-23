ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS lojas text[] NOT NULL DEFAULT '{}';
UPDATE public.user_roles SET lojas = ARRAY[loja] WHERE loja IS NOT NULL AND cardinality(lojas) = 0;

CREATE OR REPLACE FUNCTION public.user_has_loja(_user_id uuid, _loja text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND active AND (loja = _loja OR _loja = ANY(lojas))) $$;

CREATE OR REPLACE FUNCTION public.can_manage_loja(_user_id uuid, _loja text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.is_global(_user_id) OR (public.is_manager(_user_id) AND public.user_has_loja(_user_id, _loja)) $$;

CREATE OR REPLACE FUNCTION public.can_sell_loja(_user_id uuid, _loja text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.is_global(_user_id) OR (public.is_staff(_user_id) AND public.user_has_loja(_user_id, _loja)) $$;