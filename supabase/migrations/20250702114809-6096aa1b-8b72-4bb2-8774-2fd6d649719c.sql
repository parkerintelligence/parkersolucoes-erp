-- Remover constraint obsoleta que impede salvamento com novos tipos
ALTER TABLE schedule_items DROP CONSTRAINT IF EXISTS schedule_items_type_check;

-- Verificar se o trigger ainda está funcionando
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'schedule_items';