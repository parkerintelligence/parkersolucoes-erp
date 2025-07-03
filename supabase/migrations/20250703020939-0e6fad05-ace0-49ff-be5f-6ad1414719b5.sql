-- Add instance field to integrations table for Evolution API
ALTER TABLE public.integrations 
ADD COLUMN instance_name text;

-- Update existing Evolution API integration with a default instance name
UPDATE public.integrations 
SET instance_name = 'main_instance' 
WHERE type = 'evolution_api' AND instance_name IS NULL;