
-- Política para permitir que masters vejam todas as empresas
DROP POLICY IF EXISTS "Masters can view all companies" ON public.companies;
CREATE POLICY "Masters can view all companies" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Política para permitir que masters criem empresas
DROP POLICY IF EXISTS "Masters can create companies" ON public.companies;
CREATE POLICY "Masters can create companies" ON public.companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Política para permitir que masters atualizem empresas
DROP POLICY IF EXISTS "Masters can update companies" ON public.companies;
CREATE POLICY "Masters can update companies" ON public.companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Política para permitir que masters excluam empresas
DROP POLICY IF EXISTS "Masters can delete companies" ON public.companies;
CREATE POLICY "Masters can delete companies" ON public.companies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Habilitar RLS na tabela companies se não estiver habilitado
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Políticas similares para outras tabelas importantes
-- Serviços
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters can manage services" ON public.services;
CREATE POLICY "Masters can manage services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Integrações
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters can manage integrations" ON public.integrations;
CREATE POLICY "Masters can manage integrations" ON public.integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Contratos
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters can manage contracts" ON public.contracts;
CREATE POLICY "Masters can manage contracts" ON public.contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Orçamentos
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters can manage budgets" ON public.budgets;
CREATE POLICY "Masters can manage budgets" ON public.budgets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Itens de orçamento
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters can manage budget items" ON public.budget_items;
CREATE POLICY "Masters can manage budget items" ON public.budget_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Links das empresas
ALTER TABLE public.company_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters can manage company links" ON public.company_links;
CREATE POLICY "Masters can manage company links" ON public.company_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Itens da agenda
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters can manage schedule items" ON public.schedule_items;
CREATE POLICY "Masters can manage schedule items" ON public.schedule_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Conversas do WhatsApp
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters can manage whatsapp conversations" ON public.whatsapp_conversations;
CREATE POLICY "Masters can manage whatsapp conversations" ON public.whatsapp_conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Verificar se o usuário master existe e tem o perfil correto
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
