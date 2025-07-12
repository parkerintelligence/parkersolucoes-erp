-- Atualizar template de relatório Bacula com variáveis melhoradas
UPDATE whatsapp_message_templates 
SET body = '🔄 *RELATÓRIO DIÁRIO BACULA* - {{date}}

📊 *RESUMO EXECUTIVO*
• Total de Jobs: {{total_jobs}}
• Jobs com Sucesso: {{success_jobs}} ({{success_rate}}%)
• Jobs com Erro: {{error_jobs}} ({{error_rate}}%)
• Jobs com Avisos: {{warning_jobs}}
• Clientes Afetados: {{clients_with_errors}}/{{total_clients}}

{{#if error_jobs}}
⚠️ *ALERTAS IDENTIFICADOS*

{{#if hasCriticalErrors}}
🚨 *ATENÇÃO: MÚLTIPLOS ERROS CRÍTICOS*
{{/if}}

🔍 *DETALHES DOS ERROS:*
{{#each error_details}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Job: {{name}}
🏢 Cliente: {{client}}
⚡ Nível: {{level}}
🔧 Status: {{status}}
🕒 Início: {{time}}
💾 Dados: {{bytes}}
📁 Arquivos: {{files}}
{{#if errors}}❌ Erros: {{errors}}{{/if}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{/each}}

{{#if client_analysis}}
📈 *ANÁLISE POR CLIENTE*
{{#each client_analysis}}
🏢 {{name}}: {{errors}}/{{total}} jobs com erro ({{error_rate}}%)
{{/each}}
{{/if}}

{{else}}
✅ *SITUAÇÃO NORMAL*
Todos os backups foram executados com sucesso nas últimas 24 horas.

{{/if}}

🔧 *INFORMAÇÕES TÉCNICAS*
• Fonte de dados: {{data_source}}
• Jobs analisados: {{raw_jobs_count}}
• Período: {{period_start}} até {{period_end}}
• Estratégia usada: {{successful_strategy}}

🕒 Relatório gerado em: {{time}}',
    variables = '{"date": "Data do relatório", "total_jobs": "Total de jobs", "success_jobs": "Jobs com sucesso", "error_jobs": "Jobs com erro", "warning_jobs": "Jobs com avisos", "success_rate": "Taxa de sucesso", "error_rate": "Taxa de erro", "clients_with_errors": "Clientes com erros", "total_clients": "Total de clientes", "hasErrors": "Se há erros", "hasCriticalErrors": "Se há erros críticos", "error_details": "Lista de jobs com erro detalhada", "client_analysis": "Análise por cliente", "data_source": "Fonte dos dados", "raw_jobs_count": "Quantidade bruta de jobs", "period_start": "Início do período", "period_end": "Fim do período", "successful_strategy": "Estratégia de busca bem-sucedida", "time": "Horário de geração"}'
WHERE name = 'Relatório Diário de Erros Bacula'
  AND template_type = 'bacula_daily_report';