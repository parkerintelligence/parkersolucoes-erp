-- Criar tabela para agendamentos de chamados GLPI
CREATE TABLE public.glpi_scheduled_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3, -- 1=Muito Baixa, 2=Baixa, 3=Média, 4=Alta, 5=Muito Alta, 6=Crítica
  urgency INTEGER NOT NULL DEFAULT 3,
  impact INTEGER NOT NULL DEFAULT 3,
  type INTEGER NOT NULL DEFAULT 1, -- Tipo do chamado no GLPI
  category_id INTEGER, -- Categoria no GLPI
  requester_user_id INTEGER, -- ID do usuário solicitante no GLPI
  assign_user_id INTEGER, -- ID do usuário responsável no GLPI
  assign_group_id INTEGER, -- ID do grupo responsável no GLPI
  entity_id INTEGER NOT NULL DEFAULT 0, -- Entidade no GLPI
  cron_expression TEXT NOT NULL, -- Expressão cron para agendamento
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_execution TIMESTAMP WITH TIME ZONE,
  next_execution TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER NOT NULL DEFAULT 0,
  settings JSONB, -- Configurações adicionais
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.glpi_scheduled_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for glpi_scheduled_tickets
CREATE POLICY "Users can view their own scheduled tickets" 
ON public.glpi_scheduled_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled tickets" 
ON public.glpi_scheduled_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled tickets" 
ON public.glpi_scheduled_tickets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled tickets" 
ON public.glpi_scheduled_tickets 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Masters can manage all scheduled tickets" 
ON public.glpi_scheduled_tickets 
FOR ALL 
USING (get_user_role() = 'master')
WITH CHECK (get_user_role() = 'master');

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_glpi_scheduled_tickets_updated_at
BEFORE UPDATE ON public.glpi_scheduled_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for calculating next execution
CREATE TRIGGER update_glpi_scheduled_tickets_next_execution
BEFORE INSERT OR UPDATE ON public.glpi_scheduled_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_next_execution();