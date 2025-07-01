
-- Add missing FTP-related columns to the integrations table
ALTER TABLE public.integrations 
ADD COLUMN directory text,
ADD COLUMN passive_mode boolean,
ADD COLUMN use_ssl boolean,
ADD COLUMN keep_logged boolean;
