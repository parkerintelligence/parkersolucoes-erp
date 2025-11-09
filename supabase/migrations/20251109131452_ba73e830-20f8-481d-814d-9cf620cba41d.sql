-- Habilitar RLS na tabela integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Garantir que as políticas existem (DROP IF EXISTS + CREATE)
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can create their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Masters can manage all integrations" ON public.integrations;

-- Criar políticas RLS
CREATE POLICY "Users can view their own integrations" 
ON public.integrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integrations" 
ON public.integrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" 
ON public.integrations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations" 
ON public.integrations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Política especial para masters verem e gerenciarem tudo
CREATE POLICY "Masters can manage all integrations" 
ON public.integrations 
FOR ALL 
USING (get_user_role() = 'master')
WITH CHECK (get_user_role() = 'master');