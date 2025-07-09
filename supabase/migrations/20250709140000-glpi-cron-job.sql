
-- Enable the required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing cron jobs
SELECT cron.unschedule('process-glpi-tickets');
SELECT cron.unschedule('process-glpi-tickets-fixed');
SELECT cron.unschedule('process-glpi-tickets-production');

-- Create the cron job to process GLPI scheduled tickets every minute for testing
-- This will run based on Brazil/São Paulo timezone
SELECT cron.schedule_in_database(
  'process-glpi-tickets-brazil',
  '* * * * *', -- Every minute for testing
  $$
  SELECT
    net.http_post(
        url:='https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/process-glpi-scheduled-tickets',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnhwcGdveWFkd3Vra2ZvY2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjYyNjIsImV4cCI6MjA2NjkwMjI2Mn0.tNgNHrabYKZhE2nbFyqhKAyvuBBN3DMfqit8OQZBL3E"}'::jsonb,
        body:=concat('{"time": "', now() AT TIME ZONE 'America/Sao_Paulo', '", "debug": true, "timezone": "America/Sao_Paulo"}')::jsonb
    ) as request_id;
  $$,
  'postgres',
  'America/Sao_Paulo'
);

-- Verify the job was created
SELECT jobname, schedule, active, database, timezone FROM cron.job WHERE jobname = 'process-glpi-tickets-brazil';
