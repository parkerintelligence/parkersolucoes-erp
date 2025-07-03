-- Criar tabela de anotações
CREATE TABLE public.annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  company_id UUID,
  service TEXT,
  annotation TEXT,
  gera_link BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários normais
CREATE POLICY "Users can view their own annotations" 
ON public.annotations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own annotations" 
ON public.annotations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations" 
ON public.annotations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations" 
ON public.annotations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Política para usuários master (podem gerenciar todas as anotações)
CREATE POLICY "Masters can manage all annotations" 
ON public.annotations 
FOR ALL 
USING (get_user_role() = 'master')
WITH CHECK (get_user_role() = 'master');

-- Adicionar foreign key para empresas
ALTER TABLE public.annotations 
ADD CONSTRAINT annotations_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_annotations_updated_at
BEFORE UPDATE ON public.annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();