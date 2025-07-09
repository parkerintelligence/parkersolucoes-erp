
-- First, remove the existing cron job if it exists
SELECT cron.unschedule('process-glpi-tickets');

-- Create a new cron job that runs every minute for testing
-- Later can be changed to every 15 minutes: '*/15 * * * *'
SELECT cron.schedule(
  'process-glpi-tickets-fixed',
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

-- Add logging to monitor cron job execution
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the logs table
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for masters to view all logs
CREATE POLICY "Masters can view all cron logs" 
  ON public.cron_job_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );
