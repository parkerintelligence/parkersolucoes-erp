
-- Criar tabela para cadastro de serviços
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'hora',
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para orçamentos
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  budget_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para itens do orçamento
CREATE TABLE public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para contratos
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  budget_id UUID REFERENCES public.budgets(id),
  contract_number TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'cancelled', 'expired')),
  signed_date DATE,
  start_date DATE,
  end_date DATE,
  total_value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para services
CREATE POLICY "Users can view their own services" ON public.services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own services" ON public.services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own services" ON public.services FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para budgets
CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para budget_items
CREATE POLICY "Users can view budget items" ON public.budget_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.budgets WHERE budgets.id = budget_items.budget_id AND budgets.user_id = auth.uid())
);
CREATE POLICY "Users can create budget items" ON public.budget_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.budgets WHERE budgets.id = budget_items.budget_id AND budgets.user_id = auth.uid())
);
CREATE POLICY "Users can update budget items" ON public.budget_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.budgets WHERE budgets.id = budget_items.budget_id AND budgets.user_id = auth.uid())
);
CREATE POLICY "Users can delete budget items" ON public.budget_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.budgets WHERE budgets.id = budget_items.budget_id AND budgets.user_id = auth.uid())
);

-- Políticas RLS para contracts
CREATE POLICY "Users can view their own contracts" ON public.contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contracts" ON public.contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contracts" ON public.contracts FOR DELETE USING (auth.uid() = user_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mover configurações do WhatsApp para a tabela de integrações (já existe)
-- Adicionar índices para melhor performance
CREATE INDEX idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX idx_budget_items_service_id ON public.budget_items(service_id);
CREATE INDEX idx_budgets_company_id ON public.budgets(company_id);
CREATE INDEX idx_contracts_company_id ON public.contracts(company_id);
