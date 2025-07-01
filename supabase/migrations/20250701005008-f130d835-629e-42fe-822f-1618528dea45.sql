
-- Garantir que o usuário master existe e tem o perfil correto
UPDATE public.user_profiles 
SET role = 'master' 
WHERE email = 'contato@parkersolucoes.com.br';

-- Se não existir, inserir o perfil master
INSERT INTO public.user_profiles (id, email, role)
SELECT id, email, 'master'
FROM auth.users 
WHERE email = 'contato@parkersolucoes.com.br'
AND NOT EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE email = 'contato@parkersolucoes.com.br'
);

-- Verificar se as políticas RLS estão corretas para masters
-- Recriar as políticas para garantir que funcionem corretamente

-- Limpar políticas existentes
DROP POLICY IF EXISTS "Masters can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Masters can create companies" ON public.companies;
DROP POLICY IF EXISTS "Masters can update companies" ON public.companies;
DROP POLICY IF EXISTS "Masters can delete companies" ON public.companies;

-- Recriar políticas mais específicas
CREATE POLICY "Masters can manage all companies" ON public.companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Aplicar políticas similares para outras tabelas
DROP POLICY IF EXISTS "Masters can manage services" ON public.services;
CREATE POLICY "Masters can manage all services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

DROP POLICY IF EXISTS "Masters can manage integrations" ON public.integrations;
CREATE POLICY "Masters can manage all integrations" ON public.integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Função para verificar se o usuário é master
CREATE OR REPLACE FUNCTION public.is_master_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'master'
  );
$$;
