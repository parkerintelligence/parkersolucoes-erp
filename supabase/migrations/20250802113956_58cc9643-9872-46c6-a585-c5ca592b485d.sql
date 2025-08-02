-- Remove api_token from existing UniFi integrations that have username/password
UPDATE integrations 
SET api_token = NULL 
WHERE type = 'unifi' 
AND username IS NOT NULL 
AND base_url IS NOT NULL;