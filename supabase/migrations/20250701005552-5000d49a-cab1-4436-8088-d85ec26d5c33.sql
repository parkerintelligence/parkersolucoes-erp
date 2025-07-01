
-- Corrigir o problema de recursão infinita nas políticas RLS
-- Primeiro, criar uma função SECURITY DEFINER para verificar o role do usuário

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Remover todas as políticas problemáticas da tabela user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Masters can view all profiles" ON public.user_profiles;

-- Criar políticas corretas para user_profiles usando a função
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Recriar políticas para companies usando a função SECURITY DEFINER
DROP POLICY IF EXISTS "Masters can manage all companies" ON public.companies;

CREATE POLICY "Masters can manage all companies" ON public.companies
  FOR ALL USING (
    public.get_user_role() = 'master'
  )
  WITH CHECK (
    public.get_user_role() = 'master'
  );

-- Recriar políticas para services usando a função SECURITY DEFINER
DROP POLICY IF EXISTS "Masters can manage all services" ON public.services;

CREATE POLICY "Masters can manage all services" ON public.services
  FOR ALL USING (
    public.get_user_role() = 'master'
  )
  WITH CHECK (
    public.get_user_role() = 'master'
  );

-- Recriar políticas para integrations usando a função SECURITY DEFINER
DROP POLICY IF EXISTS "Masters can manage all integrations" ON public.integrations;

CREATE POLICY "Masters can manage all integrations" ON public.integrations
  FOR ALL USING (
    public.get_user_role() = 'master'
  )
  WITH CHECK (
    public.get_user_role() = 'master'
  );

-- Aplicar políticas para outras tabelas também
DROP POLICY IF EXISTS "Masters can manage contracts" ON public.contracts;
CREATE POLICY "Masters can manage all contracts" ON public.contracts
  FOR ALL USING (
    public.get_user_role() = 'master'
  )
  WITH CHECK (
    public.get_user_role() = 'master'
  );

DROP POLICY IF EXISTS "Masters can manage budgets" ON public.budgets;
CREATE POLICY "Masters can manage all budgets" ON public.budgets
  FOR ALL USING (
    public.get_user_role() = 'master'
  )
  WITH CHECK (
    public.get_user_role() = 'master'
  );

DROP POLICY IF EXISTS "Masters can manage budget items" ON public.budget_items;
CREATE POLICY "Masters can manage all budget_items" ON public.budget_items
  FOR ALL USING (
    public.get_user_role() = 'master'
  )
  WITH CHECK (
    public.get_user_role() = 'master'
  );

DROP POLICY IF EXISTS "Masters can manage company links" ON public.company_links;
CREATE POLICY "Masters can manage all company_links" ON public.company_links
  FOR ALL USING (
    public.get_user_role() = 'master'
  )
  WITH CHECK (
    public.get_user_role() = 'master'
  );

DROP POLICY IF EXISTS "Masters can manage schedule items" ON public.schedule_items;
CREATE POLICY "Masters can manage all schedule_items" ON public.schedule_items
  FOR ALL USING (
    public.get_user_role() = 'master'
  )
  WITH CHECK (
    public.get_user_role() = 'master'
  );

DROP POLICY IF EXISTS "Masters can manage whatsapp conversations" ON public.whatsapp_conversations;
CREATE POLICY "Masters can manage all whatsapp_conversations" ON public.whatsapp_conversations
  FOR ALL USING (
    public.get_user_role() = 'master'
  )
  WITH CHECK (
    public.get_user_role() = 'master'
  );

-- Atualizar a função is_master_user para usar a nova função
CREATE OR REPLACE FUNCTION public.is_master_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT public.get_user_role() = 'master';
$$;
