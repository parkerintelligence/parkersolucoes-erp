-- Adicionar mais templates para GLPI
INSERT INTO public.whatsapp_message_templates (user_id, name, template_type, subject, body, variables) 
VALUES 
  -- Template para resumo diário
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Resumo Diário GLPI',
    'glpi_summary',
    '📊 Resumo Diário GLPI - {{date}}',
    '🌅 *Resumo do Dia Anterior - GLPI*

📅 Período: {{date}}

📈 *Estatísticas do Dia:*
• Chamados criados: {{new_tickets}}
• Chamados resolvidos: {{resolved_tickets}}
• Chamados pendentes: {{pending_tickets}}
• Tempo médio de resolução: {{avg_resolution_time}}

🔥 *Chamados Críticos:*
{{critical_tickets_list}}

📋 *Chamados em Aberto:*
{{open_tickets_list}}

💡 *Produtividade:* {{productivity_summary}}

📊 Relatório automático do sistema GLPI.',
    '{"date": "Data do relatório", "new_tickets": "Novos chamados", "resolved_tickets": "Chamados resolvidos", "pending_tickets": "Chamados pendentes", "avg_resolution_time": "Tempo médio", "critical_tickets_list": "Lista de críticos", "open_tickets_list": "Lista de abertos", "productivity_summary": "Resumo de produtividade"}'::jsonb
  ),
  
  -- Template para chamados críticos
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Chamados Críticos GLPI',
    'glpi_summary',
    '🚨 Chamados Críticos - {{date}}',
    '🚨 *ATENÇÃO: Chamados Críticos*

📅 Data: {{date}}

⚠️ *{{critical_count}} chamados requerem atenção imediata:*

{{critical_tickets_detailed}}

🔴 *Ação necessária:* Revisar e priorizar imediatamente.

⏰ Alguns chamados podem estar próximos do SLA.

🔗 Acesse o GLPI para detalhes completos.',
    '{"date": "Data atual", "critical_count": "Número de críticos", "critical_tickets_detailed": "Lista detalhada de chamados críticos"}'::jsonb
  ),
  
  -- Template para performance semanal
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Performance Semanal GLPI',
    'glpi_summary',
    '📈 Performance Semanal - {{date}}',
    '📊 *Relatório Semanal - GLPI*

📅 Semana: {{week_period}}

🎯 *Indicadores de Performance:*
• Total processados: {{total_processed}}
• Taxa de resolução: {{resolution_rate}}%
• Satisfação média: {{satisfaction_score}}
• SLA cumprido: {{sla_compliance}}%

🏆 *Destaques da Semana:*
{{weekly_highlights}}

📋 *Principais Categorias:*
{{top_categories}}

🔄 *Tendências:* {{trends_summary}}

💼 Relatório gerado automaticamente.',
    '{"week_period": "Período da semana", "total_processed": "Total processado", "resolution_rate": "Taxa de resolução", "satisfaction_score": "Nota de satisfação", "sla_compliance": "Cumprimento SLA", "weekly_highlights": "Destaques", "top_categories": "Principais categorias", "trends_summary": "Resumo de tendências"}'::jsonb
  );