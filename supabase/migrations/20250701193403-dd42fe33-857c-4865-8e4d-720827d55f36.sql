
-- Update the check constraint to include GLPI type
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_type_check;

-- Add the updated constraint with GLPI included
ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check 
CHECK (type IN ('chatwoot', 'evolution_api', 'wasabi', 'grafana', 'bomcontrole', 'zabbix', 'ftp', 'glpi'));

-- Ensure RLS policies allow GLPI integration creation
-- The existing policies should already cover this, but let's verify they're active

-- Make sure masters can manage all integrations (including GLPI)
DROP POLICY IF EXISTS "Masters can manage all glpi integrations" ON public.integrations;
CREATE POLICY "Masters can manage all glpi integrations" ON public.integrations
  FOR ALL USING (
    type = 'glpi' AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- Make sure users can create GLPI integrations
DROP POLICY IF EXISTS "Users can create glpi integrations" ON public.integrations;
CREATE POLICY "Users can create glpi integrations" ON public.integrations
  FOR INSERT WITH CHECK (
    type = 'glpi' AND auth.uid() = user_id
  );
