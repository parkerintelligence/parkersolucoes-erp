-- Atualizar template Bacula com análise avançada
UPDATE whatsapp_message_templates 
SET body = '🔄 *RELATÓRIO DIÁRIO BACULA* - {{date}}

📊 *RESUMO EXECUTIVO*
• Total de Jobs: {{totalJobs}}
• Jobs com Sucesso: {{successCount}}
• Jobs com Erro: {{errorCount}} ({{errorRate}}%)
• Clientes Afetados: {{clientsAffected}}
• Falhas Recorrentes: {{recurrentFailuresCount}}

{{#if hasErrors}}
⚠️ *ALERTAS IDENTIFICADOS*

{{#if hasCriticalErrors}}
🚨 *ATENÇÃO: ERROS CRÍTICOS DETECTADOS*
{{/if}}

🔍 *DETALHES DOS ERROS:*
{{#each errorJobs}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Job: {{name}}
🏢 Cliente: {{client}}
⚡ Nível: {{level}}
🕒 Início: {{startTime}}
📦 Dados: {{bytes}}
📁 Arquivos: {{files}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{/each}}

{{#if recurrentFailuresCount}}
🔄 *FALHAS RECORRENTES DETECTADAS*
Alguns jobs estão falhando repetidamente. 
Recomenda-se investigação imediata.
{{/if}}

{{else}}
✅ *SITUAÇÃO NORMAL*
Todos os backups foram executados com sucesso nas últimas 24 horas.

{{/if}}

🕒 Relatório gerado em: {{timestamp}}'
WHERE name = 'Relatório Diário de Erros Bacula';