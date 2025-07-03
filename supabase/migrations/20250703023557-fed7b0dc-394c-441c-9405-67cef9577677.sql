-- Criar tabela para configurações do sistema
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'text', -- text, number, boolean
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, setting_key)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system_settings
CREATE POLICY "Users can view their own settings" 
ON public.system_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.system_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" 
ON public.system_settings 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Masters can manage all settings" 
ON public.system_settings 
FOR ALL 
USING (get_user_role() = 'master')
WITH CHECK (get_user_role() = 'master');

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (user_id, setting_key, setting_value, setting_type, description, category)
SELECT 
  id as user_id,
  'ftp_backup_alert_hours' as setting_key,
  '48' as setting_value,
  'number' as setting_type,
  'Número de horas para considerar um backup como desatualizado' as description,
  'ftp' as category
FROM auth.users
WHERE id IN (SELECT id FROM public.user_profiles WHERE role = 'master');