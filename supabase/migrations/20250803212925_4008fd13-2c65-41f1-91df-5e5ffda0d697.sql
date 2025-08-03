-- Insert UniFi website URL configuration
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description)
VALUES (
  'unifi_website_url',
  'https://remote.parkersolucoes.com.br:8443/',
  'text',
  'unifi',
  'URL do site UniFi a ser carregado na página'
);