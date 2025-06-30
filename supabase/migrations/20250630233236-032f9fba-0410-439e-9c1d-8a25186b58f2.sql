
-- Criar tabela para armazenar os agendamentos
CREATE TABLE public.schedule_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('certificate', 'license', 'system_update')),
  due_date DATE NOT NULL,
  description TEXT,
  company TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para que usuários vejam apenas seus próprios agendamentos
CREATE POLICY "Users can view their own schedule items" 
  ON public.schedule_items 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedule items" 
  ON public.schedule_items 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule items" 
  ON public.schedule_items 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule items" 
  ON public.schedule_items 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar automaticamente o updated_at
CREATE TRIGGER update_schedule_items_updated_at 
    BEFORE UPDATE ON public.schedule_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
