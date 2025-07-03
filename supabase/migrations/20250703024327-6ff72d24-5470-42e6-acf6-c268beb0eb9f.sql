-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar tabela para agendamentos automáticos
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'backup_alert', 'schedule_critical', 'glpi_summary'
  phone_number TEXT NOT NULL,
  cron_expression TEXT NOT NULL, -- formato cron: minuto hora dia mês dia_semana
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_execution TIMESTAMP WITH TIME ZONE,
  next_execution TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER NOT NULL DEFAULT 0,
  settings JSONB, -- configurações específicas do relatório
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for scheduled_reports
CREATE POLICY "Users can view their own scheduled reports" 
ON public.scheduled_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled reports" 
ON public.scheduled_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled reports" 
ON public.scheduled_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled reports" 
ON public.scheduled_reports 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Masters can manage all scheduled reports" 
ON public.scheduled_reports 
FOR ALL 
USING (get_user_role() = 'master')
WITH CHECK (get_user_role() = 'master');

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_scheduled_reports_updated_at
BEFORE UPDATE ON public.scheduled_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular próxima execução baseada em cron expression
CREATE OR REPLACE FUNCTION public.calculate_next_execution(cron_expr TEXT, from_time TIMESTAMP WITH TIME ZONE DEFAULT now())
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implementação simplificada para horários diários
  -- Para expressões como "0 9 * * *" (todo dia às 9h)
  -- Aqui você pode implementar um parser de cron mais complexo se necessário
  
  -- Por enquanto, vamos suportar apenas horários diários (formato: "minuto hora * * *")
  IF cron_expr ~ '^\d+ \d+ \* \* \*$' THEN
    DECLARE
      parts TEXT[];
      target_minute INTEGER;
      target_hour INTEGER;
      next_exec TIMESTAMP WITH TIME ZONE;
    BEGIN
      parts := string_to_array(cron_expr, ' ');
      target_minute := parts[1]::INTEGER;
      target_hour := parts[2]::INTEGER;
      
      -- Calcular próxima execução
      next_exec := date_trunc('day', from_time) + 
                   INTERVAL '1 hour' * target_hour + 
                   INTERVAL '1 minute' * target_minute;
      
      -- Se o horário já passou hoje, agendar para amanhã
      IF next_exec <= from_time THEN
        next_exec := next_exec + INTERVAL '1 day';
      END IF;
      
      RETURN next_exec;
    END;
  END IF;
  
  -- Fallback: próxima hora
  RETURN date_trunc('hour', from_time) + INTERVAL '1 hour';
END;
$$;

-- Trigger para atualizar next_execution automaticamente
CREATE OR REPLACE FUNCTION public.update_next_execution()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.next_execution := calculate_next_execution(NEW.cron_expression);
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_scheduled_reports_next_execution
BEFORE INSERT OR UPDATE OF cron_expression ON public.scheduled_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_next_execution();