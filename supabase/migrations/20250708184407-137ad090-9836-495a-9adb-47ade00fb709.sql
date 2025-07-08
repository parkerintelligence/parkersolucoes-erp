
-- Verificar se 'bacula' está na constraint de tipos de integração
-- Se não estiver, adicionar ao constraint
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_type_check;

-- Adicionar nova constraint incluindo 'bacula' 
ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check 
CHECK (type IN ('chatwoot', 'evolution_api', 'wasabi', 'grafana', 'bomcontrole', 'zabbix', 'ftp', 'glpi', 'mikrotik', 'unifi', 'google_drive', 'guacamole', 'bacula'));
