-- Remover políticas RLS restritivas da tabela integrations
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can create their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;

-- Criar políticas permissivas temporárias (permite todas as operações)
CREATE POLICY "Allow all access to integrations" 
ON public.integrations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Permitir que user_id seja NULL temporariamente
ALTER TABLE public.integrations 
ALTER COLUMN user_id DROP NOT NULL;