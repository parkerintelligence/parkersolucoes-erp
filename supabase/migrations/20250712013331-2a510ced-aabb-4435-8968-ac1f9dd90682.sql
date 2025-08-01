-- Verificar se o cron job do GLPI existe e está ativo
DO $$
DECLARE
    job_exists boolean;
BEGIN
    -- Verificar se o job existe
    SELECT EXISTS(
        SELECT 1 
        FROM cron.job 
        WHERE jobname = 'process-glpi-tickets-brazil'
    ) INTO job_exists;
    
    -- Se não existir, criar o job
    IF NOT job_exists THEN
        PERFORM cron.schedule_in_database(
            'process-glpi-tickets-brazil',
            '*/5 * * * *',
            $job$
            SELECT
              net.http_post(
                  url:='https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/process-glpi-scheduled-tickets',
                  headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnhwcGdveWFkd3Vra2ZvY2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjYyNjIsImV4cCI6MjA2NjkwMjI2Mn0.tNgNHrabYKZhE2nbFyqhKAyvuBBN3DMfqit8OQZBL3E"}'::jsonb,
                  body:='{"time": "", "debug": true}'::jsonb
              ) as request_id;
            $job$,
            'postgres',
            'America/Sao_Paulo'
        );
        
        RAISE NOTICE 'Cron job GLPI criado com sucesso';
    ELSE
        RAISE NOTICE 'Cron job GLPI já existe';
    END IF;
END
$$;