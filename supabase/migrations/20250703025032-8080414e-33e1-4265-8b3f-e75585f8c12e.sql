-- Criar tabela para templates de mensagens WhatsApp
CREATE TABLE public.whatsapp_message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'backup_alert', 'schedule_critical', 'glpi_summary'
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB, -- variáveis que podem ser usadas no template
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_message_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for whatsapp_message_templates
CREATE POLICY "Users can view their own templates" 
ON public.whatsapp_message_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.whatsapp_message_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.whatsapp_message_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.whatsapp_message_templates 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Masters can manage all templates" 
ON public.whatsapp_message_templates 
FOR ALL 
USING (get_user_role() = 'master')
WITH CHECK (get_user_role() = 'master');

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_whatsapp_message_templates_updated_at
BEFORE UPDATE ON public.whatsapp_message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir templates padrão
INSERT INTO public.whatsapp_message_templates (user_id, name, template_type, subject, body, variables) 
VALUES 
  -- Template para alertas de backup
  (
    (SELECT id FROM auth.users LIMIT 1), -- usuário master
    'Alerta de Backups Desatualizados',
    'backup_alert',
    '🚨 Backups Desatualizados - {{date}}',
    '⚠️ *Atenção: Backups Desatualizados*

📅 Data: {{date}}

Os seguintes backups estão há mais de {{hours_threshold}} horas sem execução:

{{backup_list}}

🔄 *Recomendação:* Verifique os sistemas e execute os backups pendentes imediatamente.

📧 Relatório gerado automaticamente pelo sistema de monitoramento.',
    '{"date": "Data atual", "hours_threshold": "Limite de horas", "backup_list": "Lista de backups desatualizados"}'::jsonb
  ),
  
  -- Template para vencimentos críticos
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Itens da Agenda com Vencimento Crítico',
    'schedule_critical',
    '📅 Vencimentos Críticos - {{date}}',
    '🔔 *Itens com Vencimento Próximo*

📅 Data: {{date}}

Os seguintes itens da agenda precisam de atenção:

{{schedule_items}}

⏰ *Ação necessária:* Revisar e tomar as providências necessárias antes do vencimento.

📋 Total de itens: {{total_items}}',
    '{"date": "Data atual", "schedule_items": "Lista de itens da agenda", "total_items": "Número total de itens"}'::jsonb
  ),
  
  -- Template para resumo GLPI
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Resumo de Chamados GLPI',
    'glpi_summary',
    '🎫 Resumo GLPI - {{date}}',
    '📊 *Resumo de Chamados GLPI*

📅 Data: {{date}}

📈 *Estatísticas:*
• Total de chamados abertos: {{open_tickets}}
• Chamados críticos: {{critical_tickets}}
• Chamados pendentes: {{pending_tickets}}

🔥 *Chamados em Aberto:*
{{ticket_list}}

💡 *Próximas ações:* Priorizar chamados críticos e pendentes.

🔗 Acesse o GLPI para mais detalhes.',
    '{"date": "Data atual", "open_tickets": "Total de chamados abertos", "critical_tickets": "Chamados críticos", "pending_tickets": "Chamados pendentes", "ticket_list": "Lista de chamados"}'::jsonb
  );