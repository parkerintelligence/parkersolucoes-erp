
-- Criar tabela para armazenar webhooks do Zabbix
CREATE TABLE public.zabbix_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('problem_created', 'problem_resolved', 'host_down', 'host_up')),
  actions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_triggered TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER NOT NULL DEFAULT 0
);

-- Habilitar RLS
ALTER TABLE public.zabbix_webhooks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários verem apenas seus próprios webhooks
CREATE POLICY "Users can view their own zabbix webhooks" 
  ON public.zabbix_webhooks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own zabbix webhooks" 
  ON public.zabbix_webhooks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own zabbix webhooks" 
  ON public.zabbix_webhooks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own zabbix webhooks" 
  ON public.zabbix_webhooks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Política para masters gerenciarem todos os webhooks
CREATE POLICY "Masters can manage all zabbix webhooks" 
  ON public.zabbix_webhooks 
  FOR ALL 
  USING (get_user_role() = 'master')
  WITH CHECK (get_user_role() = 'master');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_zabbix_webhooks_updated_at
  BEFORE UPDATE ON public.zabbix_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
