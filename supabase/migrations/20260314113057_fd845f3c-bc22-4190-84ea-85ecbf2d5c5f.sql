ALTER TABLE public.rustdesk_connections 
ADD COLUMN glpi_asset_id integer DEFAULT NULL,
ADD COLUMN glpi_asset_name text DEFAULT NULL;