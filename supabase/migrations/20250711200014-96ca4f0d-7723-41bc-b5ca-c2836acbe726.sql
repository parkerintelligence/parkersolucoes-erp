-- Criar template padrão para relatórios de erro do Bacula
INSERT INTO whatsapp_message_templates (
  name,
  subject,
  body,
  template_type,
  variables,
  is_active,
  user_id
) 
SELECT 
  'Relatório Diário de Erros Bacula',
  'Relatório de Backups com Erro',
  '🚨 *RELATÓRIO DIÁRIO - ERROS BACULA*

📅 *Data:* {{date}}
⚠️ *Total de Erros:* {{total_errors}}

{{#if has_errors}}
📋 *JOBS COM ERRO:*
{{#each failed_jobs}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔸 *Job:* {{name}}
🔸 *Cliente:* {{client}}
🔸 *Status:* {{status_description}}
🔸 *Início:* {{start_time}}
🔸 *Job ID:* {{job_id}}
{{/each}}

💡 *Ações Recomendadas:*
• Verificar logs detalhados no Bacula
• Validar conectividade com clientes
• Verificar espaço em disco nos storages
• Conferir configurações dos jobs
{{else}}
✅ *Nenhum erro encontrado no período!*
Todos os backups foram executados com sucesso.
{{/if}}

⏰ *Relatório gerado em:* {{timestamp}}

---
🤖 *Relatório automático do Sistema de Backup*',
  'backup_alert',
  '{
    "date": "Data do relatório",
    "total_errors": "Número total de erros",
    "has_errors": "Se existem erros (true/false)",
    "failed_jobs": "Array com jobs que falharam",
    "timestamp": "Horário de geração do relatório"
  }'::jsonb,
  true,
  '00000000-0000-0000-0000-000000000000'
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_message_templates 
  WHERE name = 'Relatório Diário de Erros Bacula'
);