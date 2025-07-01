
-- Atualizar a tabela integrations para incluir o tipo 'bomcontrole'
-- Adicionar campos para credenciais de usuário e senha
ALTER TABLE public.integrations 
ADD COLUMN username TEXT,
ADD COLUMN password TEXT;

-- Adicionar comentário para documentar os novos campos
COMMENT ON COLUMN public.integrations.username IS 'Username for authentication (used by Grafana and Bom Controle)';
COMMENT ON COLUMN public.integrations.password IS 'Password for authentication (used by Grafana and Bom Controle)';
