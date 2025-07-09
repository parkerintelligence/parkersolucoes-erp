
-- Criar tabela para logs detalhados dos relatórios agendados
CREATE TABLE public.scheduled_reports_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  execution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending', 'timeout')),
  phone_number TEXT NOT NULL,
  message_sent BOOLEAN NOT NULL DEFAULT false,
  message_content TEXT,
  error_details TEXT,
  execution_time_ms INTEGER,
  whatsapp_response JSONB,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para logs
ALTER TABLE public.scheduled_reports_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para logs
CREATE POLICY "Users can view their own logs" 
  ON public.scheduled_reports_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert logs" 
  ON public.scheduled_reports_logs 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Masters can manage all logs" 
  ON public.scheduled_reports_logs 
  FOR ALL 
  USING (get_user_role() = 'master');

-- Índices para performance
CREATE INDEX idx_scheduled_reports_logs_report_id ON scheduled_reports_logs(report_id);
CREATE INDEX idx_scheduled_reports_logs_execution_date ON scheduled_reports_logs(execution_date DESC);
CREATE INDEX idx_scheduled_reports_logs_status ON scheduled_reports_logs(status);
CREATE INDEX idx_scheduled_reports_logs_user_id ON scheduled_reports_logs(user_id);
