-- Criar tabela para controle de locks de concorrência
CREATE TABLE IF NOT EXISTS public.cron_execution_locks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lock_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by TEXT DEFAULT 'system'
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cron_locks_name ON public.cron_execution_locks(lock_name);
CREATE INDEX IF NOT EXISTS idx_cron_locks_expires ON public.cron_execution_locks(expires_at);

-- Adicionar campo execution_id na tabela de logs para melhor rastreamento
ALTER TABLE public.cron_job_logs 
ADD COLUMN IF NOT EXISTS execution_id UUID DEFAULT gen_random_uuid();

-- Comentários para documentação
COMMENT ON TABLE public.cron_execution_locks IS 'Controla a concorrência de execuções de cron jobs para evitar duplicações';
COMMENT ON COLUMN public.cron_execution_locks.lock_name IS 'Nome único do lock para identificar o processo';
COMMENT ON COLUMN public.cron_execution_locks.expires_at IS 'Timestamp de expiração do lock para limpeza automática';
COMMENT ON COLUMN public.cron_job_logs.execution_id IS 'Identificador único para cada execução de cron job';