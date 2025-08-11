-- Update the Bacula report cron expression from 9 AM Brasilia to 12 PM UTC (9 AM Brasilia)
UPDATE scheduled_reports 
SET 
  cron_expression = '0 12 * * *',  -- 12 PM UTC = 9 AM Brasilia
  next_execution = now() + interval '2 minutes'  -- Set to trigger in 2 minutes for testing
WHERE name = 'Relatório Diário de Erros Bacula';

-- Verify the update
SELECT name, cron_expression, next_execution, is_active 
FROM scheduled_reports 
WHERE name = 'Relatório Diário de Erros Bacula';