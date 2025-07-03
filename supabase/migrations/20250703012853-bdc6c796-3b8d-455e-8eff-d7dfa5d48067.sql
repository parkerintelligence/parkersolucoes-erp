-- Criar tabela de agendamentos recorrentes
CREATE TABLE public.recurring_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID,
  system_name TEXT NOT NULL,
  location TEXT,
  time_hour INTEGER NOT NULL CHECK (time_hour >= 0 AND time_hour <= 23),
  time_minute INTEGER NOT NULL DEFAULT 0 CHECK (time_minute >= 0 AND time_minute <= 59),
  days_of_week INTEGER[] NOT NULL CHECK (array_length(days_of_week, 1) > 0), -- 0=domingo, 1=segunda, etc
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_recurring_schedules_client FOREIGN KEY (client_id) REFERENCES public.companies(id)
);

-- Habilitar RLS
ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários normais
CREATE POLICY "Users can view their own recurring schedules" 
ON public.recurring_schedules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring schedules" 
ON public.recurring_schedules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring schedules" 
ON public.recurring_schedules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring schedules" 
ON public.recurring_schedules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Política para usuários master
CREATE POLICY "Masters can manage all recurring schedules" 
ON public.recurring_schedules 
FOR ALL 
USING (get_user_role() = 'master')
WITH CHECK (get_user_role() = 'master');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_recurring_schedules_updated_at
BEFORE UPDATE ON public.recurring_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX idx_recurring_schedules_user_id ON public.recurring_schedules(user_id);
CREATE INDEX idx_recurring_schedules_client_id ON public.recurring_schedules(client_id);
CREATE INDEX idx_recurring_schedules_days_of_week ON public.recurring_schedules USING GIN(days_of_week);