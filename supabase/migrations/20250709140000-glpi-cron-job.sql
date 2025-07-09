
-- Enable the required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing cron jobs
SELECT cron.unschedule('process-glpi-tickets');
SELECT cron.unschedule('process-glpi-tickets-fixed');

-- Create the cron job to process GLPI scheduled tickets every minute for testing
-- Change to '*/15 * * * *' for production (every 15 minutes)
SELECT cron.schedule(
  'process-glpi-tickets-production',
  '* * * * *', -- Every minute for testing
  $$
  SELECT
    net.http_post(
        url:='https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/process-glpi-scheduled-tickets',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnhwcGdveWFkd3Vra2ZvY2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjYyNjIsImV4cCI6MjA2NjkwMjI2Mn0.tNgNHrabYKZhE2nbFyqhKAyvuBBN3DMfqit8OQZBL3E"}'::jsonb,
        body:=concat('{"time": "', now(), '", "debug": true}')::jsonb
    ) as request_id;
  $$
);
