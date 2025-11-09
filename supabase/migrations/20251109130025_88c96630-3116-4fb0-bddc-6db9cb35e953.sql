-- Remover a política permissiva temporária
DROP POLICY IF EXISTS "Allow all access to integrations" ON public.integrations;

-- Atualizar registros existentes com user_id NULL para o primeiro usuário master
DO $$
DECLARE
  first_master_id uuid;
BEGIN
  -- Encontrar o primeiro usuário master
  SELECT id INTO first_master_id 
  FROM public.user_profiles 
  WHERE role = 'master' 
  LIMIT 1;
  
  -- Se encontrou um master, atualizar registros NULL
  IF first_master_id IS NOT NULL THEN
    UPDATE public.integrations 
    SET user_id = first_master_id 
    WHERE user_id IS NULL;
  END IF;
END $$;

-- Tornar user_id NOT NULL novamente
ALTER TABLE public.integrations 
ALTER COLUMN user_id SET NOT NULL;