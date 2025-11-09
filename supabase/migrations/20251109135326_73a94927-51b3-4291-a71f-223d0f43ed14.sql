-- Atualizar role do usuário para master
UPDATE user_profiles 
SET role = 'master', updated_at = now() 
WHERE email = 'contato@parkerintelligence.com.br';