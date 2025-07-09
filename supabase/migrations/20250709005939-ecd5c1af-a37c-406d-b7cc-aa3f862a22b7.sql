
-- Migração para converter report_type de valores fixos para IDs de templates
-- Primeiro, vamos verificar se existem templates padrão e criá-los se necessário

-- Inserir templates padrão se não existirem
INSERT INTO whatsapp_message_templates (user_id, name, subject, body, template_type, is_active)
SELECT 
  up.id as user_id,
  'Alerta de Backup Atrasado' as name,
  'Alerta: Backups Atrasados' as subject,
  '🚨 *Alerta de Backup*

Foram encontrados {{total_outdated}} backup(s) com mais de {{hours_threshold}} horas:

{{backup_list}}

⏰ Data/Hora: {{date}} {{time}}

Por favor, verifique os backups urgentemente!' as body,
  'backup_alert' as template_type,
  true as is_active
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_message_templates wmt 
  WHERE wmt.user_id = up.id AND wmt.template_type = 'backup_alert'
);

INSERT INTO whatsapp_message_templates (user_id, name, subject, body, template_type, is_active)
SELECT 
  up.id as user_id,
  'Resumo GLPI Diário' as name,
  'Resumo Diário - GLPI' as subject,
  '📊 *Resumo GLPI - {{date}}*

📋 **Status dos Chamados:**
• Abertos: {{open_tickets}}
• Críticos: {{critical_tickets}}  
• Pendentes: {{pending_tickets}}

🔴 **Chamados Urgentes:**
{{ticket_list}}

⏰ Relatório gerado em {{time}}' as body,
  'glpi_summary' as template_type,
  true as is_active
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_message_templates wmt 
  WHERE wmt.user_id = up.id AND wmt.template_type = 'glpi_summary'
);

INSERT INTO whatsapp_message_templates (user_id, name, subject, body, template_type, is_active)
SELECT 
  up.id as user_id,
  'Agenda Crítica - Vencimentos' as name,
  'Vencimentos Críticos na Agenda' as subject,
  '⚠️ *Vencimentos Críticos*

📅 **Itens com vencimento em até 30 dias:**

{{schedule_items}}

📊 **Resumo:**
• Total de itens: {{total_items}}
• Críticos (≤7 dias): {{critical_count}}

📆 Relatório de {{date}} às {{time}}

⚡ Ação necessária para itens críticos!' as body,
  'schedule_critical' as template_type,
  true as is_active
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_message_templates wmt 
  WHERE wmt.user_id = up.id AND wmt.template_type = 'schedule_critical'
);

-- Agora vamos atualizar os scheduled_reports existentes para usar IDs dos templates
UPDATE scheduled_reports 
SET report_type = (
  SELECT wmt.id 
  FROM whatsapp_message_templates wmt 
  WHERE wmt.user_id = scheduled_reports.user_id 
    AND wmt.template_type = scheduled_reports.report_type
    AND wmt.is_active = true
  LIMIT 1
)
WHERE report_type IN ('backup_alert', 'glpi_summary', 'schedule_critical')
  AND EXISTS (
    SELECT 1 
    FROM whatsapp_message_templates wmt 
    WHERE wmt.user_id = scheduled_reports.user_id 
      AND wmt.template_type = scheduled_reports.report_type
      AND wmt.is_active = true
  );

-- Recalcular next_execution para relatórios que estão no passado
UPDATE scheduled_reports 
SET next_execution = calculate_next_execution(cron_expression, now())
WHERE next_execution < now() 
  AND is_active = true;
