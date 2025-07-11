-- Ensure the Bacula template exists for all users
INSERT INTO whatsapp_message_templates (
  id,
  user_id,
  name,
  subject,
  body,
  template_type,
  is_active,
  variables
)
SELECT 
  'fdce6a50-7beb-4498-8925-608b77d756a1'::uuid,
  up.id,
  'Relatório Diário de Erros Bacula',
  'Relatório Diário - Erros Bacula',
  E'🔴 *RELATÓRIO DIÁRIO - ERROS BACULA*\n📅 Data: {{date}}\n⏰ Período: Últimas 24 horas\n\n{{#if hasErrors}}\n❌ *JOBS COM ERRO:*\n{{#each errorJobs}}\n• {{name}} - {{level}}\n  📂 Cliente: {{client}}\n  ⏰ Horário: {{startTime}}\n  💾 Bytes: {{bytes}}\n  📄 Arquivos: {{files}}\n{{/each}}\n\n📊 *RESUMO:*\n• Total de jobs: {{totalJobs}}\n• Jobs com erro: {{errorCount}}\n• Taxa de erro: {{errorRate}}%\n{{else}}\n✅ *NENHUM ERRO ENCONTRADO*\n\n📊 *RESUMO:*\n• Total de jobs: {{totalJobs}}\n• Todos executados com sucesso\n{{/if}}\n\n---\n🤖 Relatório automático gerado pelo sistema',
  'bacula_daily',
  true,
  '{
    "date": "Data do relatório",
    "hasErrors": "Se há erros",
    "errorJobs": "Lista de jobs com erro",
    "totalJobs": "Total de jobs",
    "errorCount": "Quantidade de erros",
    "errorRate": "Taxa de erro em porcentagem"
  }'::jsonb
FROM user_profiles up
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  template_type = EXCLUDED.template_type,
  is_active = EXCLUDED.is_active,
  variables = EXCLUDED.variables,
  updated_at = now();

-- Create default scheduled report for Bacula daily report for each user
INSERT INTO scheduled_reports (
  id,
  user_id,
  name,
  report_type,
  phone_number,
  cron_expression,
  is_active,
  settings,
  next_execution
)
SELECT 
  'bf1005ec-7c62-4b43-bb7f-b663f81d2cbb'::uuid,
  up.id,
  'Relatório Diário de Erros Bacula',
  'fdce6a50-7beb-4498-8925-608b77d756a1',
  COALESCE(
    (SELECT phone_number FROM integrations WHERE user_id = up.id AND type = 'evolution_api' AND is_active = true LIMIT 1),
    '5564999807400'
  ),
  '0 8 * * *', -- 8:00 AM daily
  true,
  '{
    "include_success": false,
    "include_warnings": true,
    "max_jobs": 50,
    "timezone": "America/Sao_Paulo"
  }'::jsonb,
  calculate_next_execution('0 8 * * *')
FROM user_profiles up
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  report_type = EXCLUDED.report_type,
  phone_number = EXCLUDED.phone_number,
  cron_expression = EXCLUDED.cron_expression,
  is_active = EXCLUDED.is_active,
  settings = EXCLUDED.settings,
  next_execution = calculate_next_execution(EXCLUDED.cron_expression),
  updated_at = now();