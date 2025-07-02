-- Remover registros problemáticos que não são mais suportados
DELETE FROM integrations WHERE type IN ('unifi', 'zabbix');

-- Corrigir constraint check para permitir google_drive
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_type_check;
ALTER TABLE integrations ADD CONSTRAINT integrations_type_check 
CHECK (type = ANY (ARRAY['chatwoot'::text, 'evolution_api'::text, 'wasabi'::text, 'grafana'::text, 'bomcontrole'::text, 'ftp'::text, 'glpi'::text, 'mikrotik'::text, 'google_drive'::text]));

-- Corrigir problema do schedule_items - garantir que type seja derivado de schedule_type_id
CREATE OR REPLACE FUNCTION get_schedule_type_name(schedule_type_id_param UUID)
RETURNS TEXT AS $$
BEGIN
  IF schedule_type_id_param IS NULL THEN
    RETURN 'Geral';
  END IF;
  
  RETURN COALESCE(
    (SELECT name FROM schedule_types WHERE id = schedule_type_id_param LIMIT 1),
    'Geral'
  );
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para preencher automaticamente o campo type
CREATE OR REPLACE FUNCTION update_schedule_item_type()
RETURNS TRIGGER AS $$
BEGIN
  NEW.type = get_schedule_type_name(NEW.schedule_type_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger
DROP TRIGGER IF EXISTS trigger_update_schedule_item_type ON schedule_items;
CREATE TRIGGER trigger_update_schedule_item_type
  BEFORE INSERT OR UPDATE ON schedule_items
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_item_type();

-- Atualizar registros existentes
UPDATE schedule_items 
SET type = get_schedule_type_name(schedule_type_id)
WHERE type IS NULL;