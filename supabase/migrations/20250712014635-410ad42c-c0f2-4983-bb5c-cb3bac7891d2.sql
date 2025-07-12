-- Criar/corrigir o cron job para processar agendamentos GLPI
-- Primeiro verificar e remover jobs existentes se houver
DO $$
DECLARE
    job_exists boolean;
BEGIN
    -- Verificar se já existe um job com esse nome
    SELECT EXISTS(
        SELECT 1 
        FROM cron.job 
        WHERE jobname = 'process-glpi-tickets-brazil'
    ) INTO job_exists;
    
    -- Se existir, remover primeiro
    IF job_exists THEN
        PERFORM cron.unschedule('process-glpi-tickets-brazil');
        RAISE NOTICE 'Job GLPI anterior removido';
    END IF;
    
    -- Criar o novo job que roda a cada 5 minutos
    PERFORM cron.schedule(
        'process-glpi-tickets-brazil',
        '*/5 * * * *',
        $job$
        SELECT
          net.http_post(
              url:='https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/process-glpi-scheduled-tickets',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnhwcGdveWFkd3Vra2ZvY2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjYyNjIsImV4cCI6MjA2NjkwMjI2Mn0.tNgNHrabYKZhE2nbFyqhKAyvuBBN3DMfqit8OQZBL3E"}'::jsonb,
              body:='{"time": "", "cron_execution": true}'::jsonb
          ) as request_id;
        $job$
    );
    
    RAISE NOTICE 'Cron job GLPI criado com sucesso - executa a cada 5 minutos';
END
$$;