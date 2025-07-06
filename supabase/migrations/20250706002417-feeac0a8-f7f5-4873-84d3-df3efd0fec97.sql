-- Remover a constraint antiga
ALTER TABLE public.integrations DROP CONSTRAINT integrations_type_check;

-- Adicionar nova constraint incluindo 'zabbix'
ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check 
CHECK ((type = ANY (ARRAY['chatwoot'::text, 'evolution_api'::text, 'wasabi'::text, 'grafana'::text, 'bomcontrole'::text, 'zabbix'::text, 'ftp'::text, 'glpi'::text, 'mikrotik'::text, 'unifi'::text, 'google_drive'::text])));