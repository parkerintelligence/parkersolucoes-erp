-- Add enable_popup_notifications column to integrations table
ALTER TABLE public.integrations
ADD COLUMN IF NOT EXISTS enable_popup_notifications BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.integrations.enable_popup_notifications IS 'Enable popup notifications for new conversations (Chatwoot)';