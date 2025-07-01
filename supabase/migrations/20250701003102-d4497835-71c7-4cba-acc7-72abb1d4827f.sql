
-- Como a tabela integrations usa TEXT para o campo type, vamos simplesmente
-- verificar se podemos inserir o valor 'zabbix' - não precisamos criar enum
-- O campo type já aceita qualquer string, então 'zabbix' funcionará normalmente

-- Vamos apenas verificar se tudo está funcionando corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'integrations' AND column_name = 'type';
