-- Update the integration type constraint to include 'wazuh'
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_type_check;

-- Add the updated constraint with 'wazuh' included
ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check 
CHECK (type IN ('glpi', 'zabbix', 'guacamole', 'grafana', 'bacula', 'chatwoot', 'ftp', 'evolution_api', 'wasabi', 'hostinger', 'unifi', 'bom_controle', 'wazuh'));