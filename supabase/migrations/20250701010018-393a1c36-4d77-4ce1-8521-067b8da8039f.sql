
-- Primeiro, vamos verificar quais tipos são permitidos e adicionar os tipos em falta
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_type_check;

-- Recriar a constraint com todos os tipos necessários
ALTER TABLE public.integrations ADD CONSTRAINT integrations_type_check 
CHECK (type IN ('chatwoot', 'evolution_api', 'wasabi', 'grafana', 'bomcontrole', 'zabbix'));

-- Tornar api_token nullable para tipos que usam username/password
ALTER TABLE public.integrations ALTER COLUMN api_token DROP NOT NULL;

-- Inserir dados fictícios para teste
-- Empresas fictícias
INSERT INTO public.companies (user_id, name, cnpj, contact, email, phone, address) VALUES
('5754f42b-507c-4461-9ff0-ccd095c7be93', 'Tech Solutions Ltda', '12.345.678/0001-90', 'João Silva', 'contato@techsolutions.com', '(11) 99999-1111', 'Rua das Flores, 123 - São Paulo/SP'),
('5754f42b-507c-4461-9ff0-ccd095c7be93', 'Inovação Digital EIRELI', '98.765.432/0001-10', 'Maria Santos', 'maria@inovacaodigital.com', '(11) 88888-2222', 'Av. Paulista, 1000 - São Paulo/SP'),
('5754f42b-507c-4461-9ff0-ccd095c7be93', 'Consultoria Empresarial S/A', '11.222.333/0001-44', 'Pedro Oliveira', 'pedro@consultoria.com', '(11) 77777-3333', 'Rua do Comércio, 456 - São Paulo/SP'),
('5754f42b-507c-4461-9ff0-ccd095c7be93', 'Serviços de TI Brasil', '55.666.777/0001-88', 'Ana Costa', 'ana@tibrasil.com', '(11) 66666-4444', 'Alameda Santos, 789 - São Paulo/SP'),
('5754f42b-507c-4461-9ff0-ccd095c7be93', 'Automação Industrial ME', '33.444.555/0001-22', 'Carlos Mendes', 'carlos@automacao.com', '(11) 55555-5555', 'Rua da Indústria, 321 - São Paulo/SP');

-- Integrações fictícias
INSERT INTO public.integrations (user_id, type, name, base_url, api_token, phone_number, is_active) VALUES
('5754f42b-507c-4461-9ff0-ccd095c7be93', 'chatwoot', 'WhatsApp Principal', 'https://app.chatwoot.com', 'chatwoot_token_123456', '+5511999999999', true),
('5754f42b-507c-4461-9ff0-ccd095c7be93', 'evolution_api', 'Evolution API Backup', 'https://evolution.example.com', 'evolution_token_789012', '+5511888888888', true),
('5754f42b-507c-4461-9ff0-ccd095c7be93', 'wasabi', 'Cloud Storage Wasabi', 'https://s3.wasabisys.com', 'wasabi_access_key_345678', null, true),
('5754f42b-507c-4461-9ff0-ccd095c7be93', 'grafana', 'Monitoramento Grafana', 'https://grafana.empresa.com', null, null, true),
('5754f42b-507c-4461-9ff0-ccd095c7be93', 'zabbix', 'Zabbix Monitoring', 'https://zabbix.empresa.com', null, null, false);

-- Atualizar as integrações que usam username/password
UPDATE public.integrations 
SET username = 'admin', password = 'grafana123' 
WHERE type = 'grafana';

UPDATE public.integrations 
SET username = 'zabbix_user', password = 'zabbix456' 
WHERE type = 'zabbix';
