-- Criar o cron job para executar o relatório diário do Bacula às 8:00 da manhã
SELECT cron.schedule(
  'bacula-daily-report',
  '0 8 * * *', -- executa todo dia às 8:00 AM
  $$
  SELECT
    net.http_post(
      url:='https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/send-bacula-daily-report',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnhwcGdveWFkd3Vra2ZvY2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjYyNjIsImV4cCI6MjA2NjkwMjI2Mn0.tNgNHrabYKZhE2nbFyqhKAyvuBBN3DMfqit8OQZBL3E"}'::jsonb,
      body:='{"trigger": "cron_daily", "timestamp": "' || now()::text || '"}'::jsonb
    ) as request_id;
  $$
);

-- Verificar se o job foi criado corretamente
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'bacula-daily-report';