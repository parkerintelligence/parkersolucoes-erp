-- Fase 1: Adicionar coluna is_global e tornar user_id nullable
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT true;

-- Tornar user_id nullable (remover NOT NULL constraint)
ALTER TABLE public.integrations 
ALTER COLUMN user_id DROP NOT NULL;

-- Atualizar integrações existentes para serem globais
UPDATE public.integrations 
SET is_global = true, user_id = NULL
WHERE is_global IS NULL OR is_global = false;

-- Fase 2: Remover políticas antigas de RLS
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can create their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can create glpi integrations" ON public.integrations;
DROP POLICY IF EXISTS "Masters can manage all glpi integrations" ON public.integrations;

-- Fase 3: Criar novas políticas para integrações globais
CREATE POLICY "All authenticated users can view global integrations"
  ON public.integrations FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    (is_global = true OR user_id = auth.uid())
  );

CREATE POLICY "Only masters can manage integrations"
  ON public.integrations FOR ALL
  USING (public.get_user_role() = 'master')
  WITH CHECK (public.get_user_role() = 'master');