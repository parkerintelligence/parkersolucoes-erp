-- Remove the existing constraint
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_type_check;

-- Add the updated constraint including all existing types plus 'wazuh'
ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check 
CHECK (type IN ('glpi', 'zabbix', 'guacamole', 'grafana', 'bacula', 'chatwoot', 'ftp', 'evolution_api', 'wasabi', 'hostinger', 'unifi', 'bom_controle', 'mikrotik', 'google_drive', 'wazuh'));