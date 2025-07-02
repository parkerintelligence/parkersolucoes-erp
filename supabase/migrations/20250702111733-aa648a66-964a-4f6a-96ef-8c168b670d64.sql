-- Criar tabela de tipos de agenda
CREATE TABLE public.schedule_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50) DEFAULT 'calendar',
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.schedule_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para schedule_types
CREATE POLICY "Users can view their own schedule types" 
ON public.schedule_types 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedule types" 
ON public.schedule_types 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule types" 
ON public.schedule_types 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule types" 
ON public.schedule_types 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Masters can manage all schedule types" 
ON public.schedule_types 
FOR ALL 
USING (get_user_role() = 'master')
WITH CHECK (get_user_role() = 'master');

-- Inserir tipos padrão
INSERT INTO public.schedule_types (name, description, color, icon, user_id) 
SELECT 
  'Certificado',
  'Renovação de certificados SSL/TLS',
  '#10b981',
  'award',
  auth.uid()
WHERE auth.uid() IS NOT NULL;

INSERT INTO public.schedule_types (name, description, color, icon, user_id) 
SELECT 
  'Licença',
  'Renovação de licenças de software',
  '#f59e0b',
  'key',
  auth.uid()
WHERE auth.uid() IS NOT NULL;

INSERT INTO public.schedule_types (name, description, color, icon, user_id) 
SELECT 
  'Atualização de Sistema',
  'Atualizações de sistemas e aplicações',
  '#3b82f6',
  'refresh-cw',
  auth.uid()
WHERE auth.uid() IS NOT NULL;

-- Adicionar coluna schedule_type_id na tabela schedule_items
ALTER TABLE public.schedule_items ADD COLUMN schedule_type_id UUID REFERENCES public.schedule_types(id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_schedule_types_updated_at
  BEFORE UPDATE ON public.schedule_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();