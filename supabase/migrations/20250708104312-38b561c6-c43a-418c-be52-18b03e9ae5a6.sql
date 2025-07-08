
-- Remover a constraint antiga
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_type_check;

-- Adicionar nova constraint incluindo 'guacamole'
ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check 
CHECK (type IN ('chatwoot', 'evolution_api', 'wasabi', 'grafana', 'bomcontrole', 'zabbix', 'ftp', 'glpi', 'mikrotik', 'unifi', 'google_drive', 'guacamole'));
