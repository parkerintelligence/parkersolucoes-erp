CREATE TABLE public.chatwoot_bridge_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evolution_integration_id UUID,
  chatwoot_integration_id UUID,
  instance_name TEXT,
  account_id TEXT,
  inbox_id TEXT,
  inbox_identifier TEXT,
  webhook_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_inbound_at TIMESTAMP WITH TIME ZONE,
  last_outbound_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chatwoot_bridge_config TO authenticated;
GRANT ALL ON public.chatwoot_bridge_config TO service_role;

ALTER TABLE public.chatwoot_bridge_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage bridge config"
ON public.chatwoot_bridge_config
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_chatwoot_bridge_config_updated_at
BEFORE UPDATE ON public.chatwoot_bridge_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();