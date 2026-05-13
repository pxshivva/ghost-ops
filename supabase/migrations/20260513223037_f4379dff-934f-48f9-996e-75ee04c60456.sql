
-- Drop all permissive write policies; keep only SELECT for public reads.
DROP POLICY IF EXISTS "public write signals" ON public.signals;
DROP POLICY IF EXISTS "public update signals" ON public.signals;
DROP POLICY IF EXISTS "public delete signals" ON public.signals;

DROP POLICY IF EXISTS "public write ghost" ON public.ghost_processes;
DROP POLICY IF EXISTS "public update ghost" ON public.ghost_processes;
DROP POLICY IF EXISTS "public delete ghost" ON public.ghost_processes;

DROP POLICY IF EXISTS "public write submissions" ON public.submissions;

DROP POLICY IF EXISTS "public update settings" ON public.settings;

-- Harden function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin new.updated_at = now(); return new; end
$function$;
