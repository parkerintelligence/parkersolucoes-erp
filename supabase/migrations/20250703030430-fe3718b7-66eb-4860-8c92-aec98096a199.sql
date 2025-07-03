-- Criar bucket para logos e assets da empresa
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true);

-- Criar políticas para o bucket de assets da empresa
CREATE POLICY "Company assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-assets');

CREATE POLICY "Authenticated users can upload company assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update company assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete company assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);

-- Inserir configuração padrão para logo da empresa
INSERT INTO public.system_settings (user_id, setting_key, setting_value, category, setting_type, description)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'company_logo_url',
  '',
  'branding',
  'text',
  'URL da logo da empresa exibida no sistema'
WHERE NOT EXISTS (
  SELECT 1 FROM public.system_settings WHERE setting_key = 'company_logo_url'
);

INSERT INTO public.system_settings (user_id, setting_key, setting_value, category, setting_type, description)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'company_name',
  'Sistema de Gestão de TI',
  'branding',
  'text',
  'Nome da empresa exibido no sistema'
WHERE NOT EXISTS (
  SELECT 1 FROM public.system_settings WHERE setting_key = 'company_name'
);