-- Remove existing check constraint if it exists
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_type_check;

-- Create new check constraint that includes unifi
ALTER TABLE integrations ADD CONSTRAINT integrations_type_check 
CHECK (type IN ('chatwoot', 'evolution_api', 'wasabi', 'grafana', 'bomcontrole', 'zabbix', 'ftp', 'glpi', 'mikrotik', 'unifi'));

-- Verify the constraint was created
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'integrations_type_check';