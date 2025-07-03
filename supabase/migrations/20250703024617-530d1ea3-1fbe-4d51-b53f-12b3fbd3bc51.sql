-- Configurar cron job para executar relatórios agendados a cada minuto
SELECT cron.schedule(
  'process-scheduled-reports',
  '* * * * *', -- executa a cada minuto
  $$
  SELECT
    net.http_post(
      url:='https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/process-scheduled-reports',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnhwcGdveWFkd3Vra2ZvY2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjYyNjIsImV4cCI6MjA2NjkwMjI2Mn0.tNgNHrabYKZhE2nbFyqhKAyvuBBN3DMfqit8OQZBL3E"}'::jsonb,
      body:='{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);