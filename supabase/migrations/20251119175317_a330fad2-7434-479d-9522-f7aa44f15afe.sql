-- Criar template padrão para relatório Mikrotik Dashboard consolidado
-- Este template será usado para enviar relatórios automáticos com dados de todos os clientes Mikrotik

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Criar template para cada usuário que ainda não tem
  FOR v_user_id IN 
    SELECT id FROM auth.users
  LOOP
    -- Verificar se o template já existe para este usuário
    IF NOT EXISTS (
      SELECT 1 FROM whatsapp_message_templates 
      WHERE template_type = 'mikrotik_dashboard' 
      AND user_id = v_user_id
    ) THEN
      -- Criar o template
      INSERT INTO whatsapp_message_templates (
        user_id,
        name,
        template_type,
        subject,
        body,
        is_active,
        variables
      ) VALUES (
        v_user_id,
        'Relatório Consolidado Mikrotik Dashboard',
        'mikrotik_dashboard',
        'Dashboard Mikrotik - Relatório Automático',
        'Este template gera automaticamente um relatório consolidado com dados de todos os clientes Mikrotik cadastrados. O relatório inclui: informações do sistema, recursos (CPU/RAM), interfaces, DHCP, firewall, NAT, VPN e alertas de status.',
        true,
        '{}'::jsonb
      );
      
      RAISE NOTICE 'Template Mikrotik Dashboard criado para usuário: %', v_user_id;
    END IF;
  END LOOP;
END $$;