-- Adicionar coluna de cor para agendamentos recorrentes
ALTER TABLE public.recurring_schedules 
ADD COLUMN color TEXT DEFAULT '#3b82f6';

-- Adicionar coluna de cor para agendamentos comuns  
ALTER TABLE public.schedule_items 
ADD COLUMN color TEXT DEFAULT '#3b82f6';

-- Criar índice para performance na consulta por cor
CREATE INDEX idx_recurring_schedules_color ON public.recurring_schedules(color);
CREATE INDEX idx_schedule_items_color ON public.schedule_items(color);