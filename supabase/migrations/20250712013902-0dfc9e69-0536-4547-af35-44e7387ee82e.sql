-- Adicionar campo user_token específico para integrações GLPI
ALTER TABLE public.integrations 
ADD COLUMN user_token TEXT NULL;

-- Comentário explicativo sobre os campos
COMMENT ON COLUMN public.integrations.api_token IS 'App-Token do GLPI (para aplicação)';
COMMENT ON COLUMN public.integrations.user_token IS 'User-Token do GLPI (para usuário específico)';
COMMENT ON COLUMN public.integrations.username IS 'Nome de usuário (para referência, não usado na autenticação GLPI)';