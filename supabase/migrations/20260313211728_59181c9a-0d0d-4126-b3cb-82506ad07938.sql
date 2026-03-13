
-- Table for RustDesk saved connections
CREATE TABLE public.rustdesk_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  rustdesk_id TEXT NOT NULL,
  password TEXT,
  alias TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  hostname TEXT,
  os_type TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_online BOOLEAN DEFAULT false,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rustdesk_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters can manage all rustdesk connections" ON public.rustdesk_connections FOR ALL USING (get_user_role() = 'master') WITH CHECK (get_user_role() = 'master');
CREATE POLICY "Users can view their own rustdesk connections" ON public.rustdesk_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own rustdesk connections" ON public.rustdesk_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rustdesk connections" ON public.rustdesk_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own rustdesk connections" ON public.rustdesk_connections FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_rustdesk_connections_updated_at BEFORE UPDATE ON public.rustdesk_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
