-- Verificar e corrigir o enum integration_type
DO $$ 
BEGIN
    -- Verificar se 'hostinger' já existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'hostinger' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
    ) THEN
        -- Adicionar 'hostinger' ao enum se não existir
        ALTER TYPE integration_type ADD VALUE 'hostinger';
    END IF;
END $$;