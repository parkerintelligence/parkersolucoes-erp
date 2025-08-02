-- Force update to remove api_token from UniFi integration
UPDATE integrations 
SET 
  api_token = NULL,
  updated_at = now()
WHERE type = 'unifi' 
AND id = 'f1dbed11-af08-4c86-af9f-90ad91718141';