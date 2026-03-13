CREATE POLICY "Public can view branding settings"
ON public.system_settings
FOR SELECT
TO anon, authenticated
USING (category = 'branding');