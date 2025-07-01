-- Fix the integration_type constraint to include all valid types
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_type_check;

-- Add updated constraint with all integration types including mikrotik
ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check 
CHECK (type IN ('chatwoot', 'evolution_api', 'wasabi', 'grafana', 'bomcontrole', 'zabbix', 'ftp', 'glpi', 'mikrotik'));