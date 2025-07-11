-- Corrigir o user_id do template Bacula para o usuário ativo
UPDATE whatsapp_message_templates 
SET user_id = '5754f42b-507c-4461-9ff0-ccd095c7be93'
WHERE id = 'fdce6a50-7beb-4498-8925-608b77d756a1';