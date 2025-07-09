
-- Primeiro, vamos verificar se o cron job existe e recriá-lo com a configuração correta
SELECT cron.unschedule('process-scheduled-reports');

-- Recriar o cron job com a sintaxe correta e executar a cada minuto
SELECT cron.schedule(
  'process-scheduled-reports',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/process-scheduled-reports',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnhwcGdveWFkd3Vra2ZvY2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjYyNjIsImV4cCI6MjA2NjkwMjI2Mn0.tNgNHrabYKZhE2nbFyqhKAyvuBBN3DMfqit8OQZBL3E"}'::jsonb,
      body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Verificar se o job foi criado corretamente
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'process-scheduled-reports';
