ALTER TABLE public.rustdesk_connections
  ADD COLUMN IF NOT EXISTS glpi_asset_serial text,
  ADD COLUMN IF NOT EXISTS glpi_asset_entity text,
  ADD COLUMN IF NOT EXISTS glpi_asset_comment text;