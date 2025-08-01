-- Corrigir a URL base da integração UniFi de unifi.ui.com para api.ui.com
UPDATE integrations 
SET base_url = 'https://api.ui.com'
WHERE type = 'unifi' 
  AND base_url LIKE '%unifi.ui.com%';