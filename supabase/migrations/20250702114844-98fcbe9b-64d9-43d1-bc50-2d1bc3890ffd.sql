-- Recriar a função e trigger para garantir funcionamento correto
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

-- Recriar função do trigger
CREATE OR REPLACE FUNCTION update_schedule_item_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Preencher o campo type baseado no schedule_type_id
  NEW.type = get_schedule_type_name(NEW.schedule_type_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover e recriar o trigger
DROP TRIGGER IF EXISTS trigger_update_schedule_item_type ON schedule_items;
CREATE TRIGGER trigger_update_schedule_item_type
  BEFORE INSERT OR UPDATE ON schedule_items
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_item_type();

-- Testar se a função está funcionando
SELECT get_schedule_type_name(NULL) as test_null;
SELECT get_schedule_type_name((SELECT id FROM schedule_types LIMIT 1)) as test_with_id;