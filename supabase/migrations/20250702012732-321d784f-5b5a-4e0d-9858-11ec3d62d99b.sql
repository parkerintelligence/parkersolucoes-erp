-- Add UNIFI integration type to the enum if not exists
DO $$ 
BEGIN
    -- Add unifi to integration_type enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'unifi' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_type')
    ) THEN
        ALTER TYPE integration_type ADD VALUE 'unifi';
    END IF;
END $$;