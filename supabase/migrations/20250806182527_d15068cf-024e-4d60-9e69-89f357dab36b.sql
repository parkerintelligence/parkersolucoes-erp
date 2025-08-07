-- Atualizar template do relatório Bacula para incluir todos os jobs
UPDATE whatsapp_message_templates 
SET body = '📊 *RELATÓRIO BACULA - DIA ANTERIOR*

📅 *Data Analisada:* {{analysis_date}}
🕐 *Gerado em:* {{report_time}}

📈 *RESUMO GERAL:*
• Total de jobs: {{total_jobs}}
• Sucessos: {{success_jobs}} ({{success_rate}}%)
• Erros/Falhas: {{error_jobs}}
• Cancelados: {{cancelled_jobs}}
• Em execução: {{running_jobs}}
• Bloqueados: {{blocked_jobs}}
• Outros status: {{other_jobs}}

💾 *DADOS PROCESSADOS:*
• Total de bytes: {{total_bytes}}
• Total de arquivos: {{total_files}}

✅ *JOBS COM SUCESSO ({{success_jobs}}):*
{{success_jobs_details}}

{{#if error_jobs}}
❌ *JOBS COM ERRO/FALHA ({{error_jobs}}):*
{{error_jobs_details}}
{{/if}}

{{#if cancelled_jobs}}
🚫 *JOBS CANCELADOS ({{cancelled_jobs}}):*
{{cancelled_jobs_details}}
{{/if}}

{{#if running_jobs}}
🔄 *JOBS EM EXECUÇÃO ({{running_jobs}}):*
{{running_jobs_details}}
{{/if}}

{{#if blocked_jobs}}
⏸️ *JOBS BLOQUEADOS/AGUARDANDO ({{blocked_jobs}}):*
{{blocked_jobs_details}}
{{/if}}

{{#if other_jobs}}
❓ *OUTROS STATUS ({{other_jobs}}):*
{{other_jobs_details}}
{{/if}}

{{#if critical_jobs}}
🚨 *ATENÇÃO:* {{critical_jobs}} job(s) precisam de atenção (erros + cancelados)
{{/if}}

📋 *Status de saúde:* {{#if success_rate >= 95}}🟢 Excelente{{else}}{{#if success_rate >= 80}}🟡 Atenção{{else}}🔴 Crítico{{/if}}{{/if}}',
updated_at = now()
WHERE template_type = 'bacula_daily_report' AND is_active = true;