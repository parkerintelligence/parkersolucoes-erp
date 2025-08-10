-- Add user_token field to integrations table to store the user's authentication token
ALTER TABLE integrations 
ADD COLUMN user_token text;