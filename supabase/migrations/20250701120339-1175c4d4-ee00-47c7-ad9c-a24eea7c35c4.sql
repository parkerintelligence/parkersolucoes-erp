
-- Add missing port column to the integrations table for FTP
ALTER TABLE public.integrations 
ADD COLUMN port integer;
