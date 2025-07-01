
-- Add GLPI integration type to the integrations table
-- First, check if the enum already exists and add GLPI if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_type') THEN
        CREATE TYPE integration_type AS ENUM ('chatwoot', 'evolution_api', 'wasabi', 'grafana', 'bomcontrole', 'zabbix', 'ftp', 'glpi');
    ELSE
        -- Add GLPI to existing enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'glpi' AND enumtypid = 'integration_type'::regtype) THEN
            ALTER TYPE integration_type ADD VALUE 'glpi';
        END IF;
    END IF;
END $$;
