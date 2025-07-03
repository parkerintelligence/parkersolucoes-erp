-- Create table for schedule services
CREATE TABLE public.schedule_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.schedule_services ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own schedule services" 
ON public.schedule_services 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedule services" 
ON public.schedule_services 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule services" 
ON public.schedule_services 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule services" 
ON public.schedule_services 
FOR DELETE 
USING (auth.uid() = user_id);

-- Masters can manage all schedule services
CREATE POLICY "Masters can manage all schedule services" 
ON public.schedule_services 
FOR ALL 
USING (get_user_role() = 'master'::text)
WITH CHECK (get_user_role() = 'master'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_schedule_services_updated_at
BEFORE UPDATE ON public.schedule_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();