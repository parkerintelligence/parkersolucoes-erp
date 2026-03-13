
CREATE TABLE public.automation_processes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  systems TEXT[] DEFAULT '{}',
  destination TEXT,
  recipient TEXT,
  frequency TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own automation processes"
  ON public.automation_processes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automation processes"
  ON public.automation_processes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation processes"
  ON public.automation_processes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation processes"
  ON public.automation_processes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Masters can manage all automation processes"
  ON public.automation_processes FOR ALL
  USING (get_user_role() = 'master')
  WITH CHECK (get_user_role() = 'master');

CREATE TRIGGER update_automation_processes_updated_at
  BEFORE UPDATE ON public.automation_processes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
