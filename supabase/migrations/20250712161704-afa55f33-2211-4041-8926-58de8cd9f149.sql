-- Criar tabelas para o sistema de Plano de Ação estilo Trello
CREATE TABLE public.action_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.action_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#64748b',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.action_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#f8fafc',
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.action_card_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL,
  text TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar foreign keys
ALTER TABLE public.action_columns 
ADD CONSTRAINT action_columns_board_id_fkey 
FOREIGN KEY (board_id) REFERENCES public.action_boards(id) ON DELETE CASCADE;

ALTER TABLE public.action_cards 
ADD CONSTRAINT action_cards_column_id_fkey 
FOREIGN KEY (column_id) REFERENCES public.action_columns(id) ON DELETE CASCADE;

ALTER TABLE public.action_card_items 
ADD CONSTRAINT action_card_items_card_id_fkey 
FOREIGN KEY (card_id) REFERENCES public.action_cards(id) ON DELETE CASCADE;

-- Habilitar RLS
ALTER TABLE public.action_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_card_items ENABLE ROW LEVEL SECURITY;

-- Políticas para action_boards
CREATE POLICY "Masters can manage all boards" ON public.action_boards
FOR ALL USING (get_user_role() = 'master') WITH CHECK (get_user_role() = 'master');

CREATE POLICY "Users can view their own boards" ON public.action_boards
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards" ON public.action_boards
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" ON public.action_boards
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" ON public.action_boards
FOR DELETE USING (auth.uid() = user_id);

-- Políticas para action_columns
CREATE POLICY "Masters can manage all columns" ON public.action_columns
FOR ALL USING (get_user_role() = 'master') WITH CHECK (get_user_role() = 'master');

CREATE POLICY "Users can view their own columns" ON public.action_columns
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own columns" ON public.action_columns
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own columns" ON public.action_columns
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own columns" ON public.action_columns
FOR DELETE USING (auth.uid() = user_id);

-- Políticas para action_cards
CREATE POLICY "Masters can manage all cards" ON public.action_cards
FOR ALL USING (get_user_role() = 'master') WITH CHECK (get_user_role() = 'master');

CREATE POLICY "Users can view their own cards" ON public.action_cards
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cards" ON public.action_cards
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" ON public.action_cards
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" ON public.action_cards
FOR DELETE USING (auth.uid() = user_id);

-- Políticas para action_card_items
CREATE POLICY "Masters can manage all card items" ON public.action_card_items
FOR ALL USING (get_user_role() = 'master') WITH CHECK (get_user_role() = 'master');

CREATE POLICY "Users can view their own card items" ON public.action_card_items
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own card items" ON public.action_card_items
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card items" ON public.action_card_items
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card items" ON public.action_card_items
FOR DELETE USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_action_boards_updated_at
BEFORE UPDATE ON public.action_boards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_columns_updated_at
BEFORE UPDATE ON public.action_columns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_cards_updated_at
BEFORE UPDATE ON public.action_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_card_items_updated_at
BEFORE UPDATE ON public.action_card_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();