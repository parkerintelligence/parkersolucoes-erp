-- Tornar base_url nullable para integrações UniFi que usam Site Manager API
ALTER TABLE public.integrations ALTER COLUMN base_url DROP NOT NULL;

-- Limpar campos desnecessários das integrações UniFi existentes
-- Manter apenas api_token para Site Manager API
UPDATE public.integrations 
SET 
  base_url = NULL,
  username = NULL,
  password = NULL,
  port = NULL,
  use_ssl = NULL
WHERE type = 'unifi' AND api_token IS NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.integrations.base_url IS 'URL base para controladora local UniFi - NULL para Site Manager API';
COMMENT ON COLUMN public.integrations.api_token IS 'API Token para UniFi Site Manager API - campo principal para integração';