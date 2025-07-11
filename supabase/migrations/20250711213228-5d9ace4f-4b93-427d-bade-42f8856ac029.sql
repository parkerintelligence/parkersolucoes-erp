-- Criar webhook específico para incidentes Bacula
INSERT INTO public.zabbix_webhooks (
  id,
  name,
  trigger_type,
  is_active,
  trigger_count,
  actions,
  user_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Webhook Bacula Incidents',
  'problem_created',
  true,
  0,
  '{
    "send_whatsapp": true,
    "create_glpi_ticket": false,
    "whatsapp_number": "5564993085995",
    "glpi_entity_id": 0,
    "custom_message": "🚨 INCIDENTE BACULA\n\nProblema: {problem_name}\nHost: {host_name}\nSeveridade: {severity}\nStatus: Ativo\nHorário: {timestamp}\n\n⚠️ Verificação necessária no sistema Bacula"
  }'::jsonb,
  '5754f42b-507c-4461-9ff0-ccd095c7be93',
  now(),
  now()
);