
-- Adicionar colunas necessárias para Wasabi na tabela integrations
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS bucket_name text,
ADD COLUMN IF NOT EXISTS region text;

-- Atualizar o constraint de tipos para incluir todos os tipos necessários
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_type_check;
ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check 
CHECK (type IN ('chatwoot', 'evolution_api', 'wasabi', 'grafana', 'bomcontrole', 'zabbix', 'glpi', 'other'));
