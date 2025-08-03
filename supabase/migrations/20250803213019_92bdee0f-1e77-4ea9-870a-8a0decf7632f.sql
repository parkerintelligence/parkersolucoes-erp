-- Remove the fixed UniFi URL entry since it should be configurable
DELETE FROM system_settings WHERE setting_key = 'unifi_website_url';