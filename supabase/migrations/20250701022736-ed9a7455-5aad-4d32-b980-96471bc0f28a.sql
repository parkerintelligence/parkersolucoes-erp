
-- Atualizar a constraint da tabela integrations para aceitar o tipo 'ftp'
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_type_check;
ALTER TABLE integrations ADD CONSTRAINT integrations_type_check 
CHECK (type IN ('chatwoot', 'evolution_api', 'wasabi', 'grafana', 'bomcontrole', 'zabbix', 'ftp'));
