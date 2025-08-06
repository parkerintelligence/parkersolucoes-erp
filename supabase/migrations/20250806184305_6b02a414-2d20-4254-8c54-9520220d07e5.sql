-- Atualizar o template "Relatório Diário de Erros Bacula" com a nova estrutura
UPDATE public.whatsapp_message_templates 
SET 
  name = 'Relatório Diário Completo Bacula',
  body = '🔵 *RELATÓRIO DIÁRIO BACULA* - {{date}}
📅 *Período*: {{period}}

📊 *RESUMO EXECUTIVO*
• Total de Jobs: {{total_jobs}}
• Jobs com Sucesso: {{success_jobs}}
• Jobs com Erro: {{error_jobs}} 
• Jobs Cancelados: {{cancelled_jobs}}
• Jobs em Execução: {{running_jobs}}
• Jobs Bloqueados: {{blocked_jobs}}
• Taxa de Sucesso: {{success_rate}}%

{{#if success_jobs_details}}
✅ *JOBS COM SUCESSO ({{success_jobs}})*
{{success_jobs_details}}
{{/if}}

{{#if error_jobs_details}}
🔴 *JOBS COM ERRO ({{error_jobs}})*
{{error_jobs_details}}
{{/if}}

{{#if cancelled_jobs_details}}
⚠️ *JOBS CANCELADOS ({{cancelled_jobs}})*
{{cancelled_jobs_details}}
{{/if}}

{{#if running_jobs_details}}
🔄 *JOBS EM EXECUÇÃO ({{running_jobs}})*
{{running_jobs_details}}
{{/if}}

{{#if blocked_jobs_details}}
🚫 *JOBS BLOQUEADOS ({{blocked_jobs}})*
{{blocked_jobs_details}}
{{/if}}

{{#if other_jobs_details}}
📋 *OUTROS STATUS ({{other_jobs}})*
{{other_jobs_details}}
{{/if}}

📈 *ESTATÍSTICAS GERAIS*
• Dados Processados: {{total_bytes}}
• Arquivos Processados: {{total_files}}
• Duração Média: {{avg_duration}}

{{#if has_issues}}
🚨 *ANÁLISE CRÍTICA*
• Total de Problemas: {{total_issues}}
• Clientes Afetados: {{affected_clients}} de {{total_clients}}

📋 *RECOMENDAÇÕES*:
{{#if error_jobs}}
• Verificar logs dos jobs com erro imediatamente
• Analisar espaço em disco e conectividade
{{/if}}
{{#if cancelled_jobs}}
• Investigar motivos dos cancelamentos
• Reagendar jobs cancelados se necessário
{{/if}}
{{#if blocked_jobs}}
• Verificar recursos disponíveis no servidor
• Analisar dependências dos jobs bloqueados
{{/if}}
{{else}}
✅ *SITUAÇÃO NORMAL*
Todos os jobs executaram com sucesso no período analisado.
{{/if}}

🕒 Relatório gerado em: {{current_time}}
🔍 Período analisado: {{start_date}} até {{end_date}}',
  updated_at = now()
WHERE template_type = 'bacula_daily';