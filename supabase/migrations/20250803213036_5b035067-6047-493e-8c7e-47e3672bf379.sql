-- Insert UniFi website URL configuration
INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, category, description)
VALUES (
  '5754f42b-507c-4461-9ff0-ccd095c7be93',
  'unifi_website_url',
  'https://remote.parkersolucoes.com.br:8443/',
  'text',
  'unifi',
  'URL do site UniFi a ser carregado na página'
);