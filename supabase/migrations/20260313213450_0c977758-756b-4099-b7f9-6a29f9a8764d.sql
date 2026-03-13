ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_type_check;

ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check CHECK (type IN ('chatwoot', 'evolution_api', 'glpi', 'zabbix', 'grafana', 'ftp', 'wasabi', 'bacula', 'guacamole', 'unifi', 'wazuh', 'mikrotik', 'hostinger', 'bom_controle', 'rustdesk', 'google_drive'));