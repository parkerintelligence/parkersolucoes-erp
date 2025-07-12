-- Criar tabela de logs do cron se não existir
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas para logs
CREATE POLICY "Sistema pode inserir logs" 
ON public.cron_job_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Masters podem ver todos os logs" 
ON public.cron_job_logs 
FOR SELECT 
USING (get_user_role() = 'master');

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_name_created_at ON public.cron_job_logs(job_name, created_at DESC);