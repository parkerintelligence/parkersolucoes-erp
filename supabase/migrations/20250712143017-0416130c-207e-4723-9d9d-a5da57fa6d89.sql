-- Adicionar o tipo 'guacamole' ao enum integration_type se não existir
-- Verificar se o tipo já existe para evitar erro
DO $$
BEGIN
    -- Tentar adicionar o valor ao enum se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'integration_type' 
        AND e.enumlabel = 'guacamole'
    ) THEN
        ALTER TYPE integration_type ADD VALUE 'guacamole';
    END IF;
END $$;