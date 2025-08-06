-- Atualizar template existente do relatório Bacula para incluir jobs FATAL e CANCELADO dos últimos 2 dias
UPDATE whatsapp_message_templates 
SET 
  body = '🚨 *RELATÓRIO CRÍTICO BACULA* - Últimos 2 Dias
📅 *Período*: {{date}}

📊 *RESUMO EXECUTIVO*
• Total de Jobs: {{total_jobs}}
• Jobs com Sucesso: {{success_jobs}}
• Jobs Fatais: {{fatal_jobs}} 
• Jobs Cancelados: {{cancelled_jobs}}
• Taxa de Erro: {{error_rate}}%

{{#if fatal_jobs}}
🔴 *JOBS FATAIS (STATUS FATAL)*
{{#each fatal_details}}
❌ *{{name}}*
   🏢 Cliente: {{client}}
   🕐 Horário: {{time}}
   ⚡ Tipo: {{level}}
   📊 Dados: {{bytes}}
   🗂️ Arquivos: {{files}}
   ⚠️ Motivo: {{reason}}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{/each}}
{{/if}}

{{#if cancelled_jobs}}
⚠️ *JOBS CANCELADOS (STATUS CANCELADO)*
{{#each cancelled_details}}
🚫 *{{name}}*
   🏢 Cliente: {{client}}
   🕐 Horário: {{time}}
   ⚡ Tipo: {{level}}
   📊 Dados: {{bytes}}
   🗂️ Arquivos: {{files}}
   ⚠️ Motivo: {{reason}}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{/each}}
{{/if}}

{{#if hasCriticalErrors}}
🚨 *ANÁLISE CRÍTICA*
• Total de Problemas: {{critical_jobs}}
• Clientes Afetados: {{clients_with_errors}} de {{total_clients}}

📋 *RECOMENDAÇÕES*:
{{#if fatal_jobs}}
• Verificar logs dos jobs fatais imediatamente
• Analisar espaço em disco e conectividade
{{/if}}
{{#if cancelled_jobs}}
• Investigar motivos dos cancelamentos
• Reagendar jobs cancelados se necessário
{{/if}}

{{else}}
✅ *SITUAÇÃO NORMAL*
Nenhum job fatal ou cancelado detectado nos últimos 2 dias.

{{/if}}

🕒 Relatório gerado em: {{time}}
🔍 Período analisado: {{period_start}} até {{period_end}}',
  
  variables = jsonb_build_object(
    'date', 'Período do relatório (2 dias)',
    'total_jobs', 'Total de jobs analisados',
    'fatal_jobs', 'Quantidade de jobs com status FATAL',
    'cancelled_jobs', 'Quantidade de jobs com status CANCELADO', 
    'critical_jobs', 'Total de jobs críticos (Fatal + Cancelado)',
    'success_jobs', 'Jobs executados com sucesso',
    'error_rate', 'Taxa de erro em porcentagem',
    'clients_with_errors', 'Clientes com problemas',
    'total_clients', 'Total de clientes',
    'fatal_details', 'Lista detalhada de jobs fatais',
    'cancelled_details', 'Lista detalhada de jobs cancelados',
    'hasCriticalErrors', 'Se existem problemas críticos',
    'time', 'Horário de geração do relatório',
    'period_start', 'Início do período analisado',
    'period_end', 'Fim do período analisado'
  ),
  
  updated_at = now()
WHERE template_type = 'bacula_daily' 
  AND name = 'Relatório Diário de Erros Bacula';