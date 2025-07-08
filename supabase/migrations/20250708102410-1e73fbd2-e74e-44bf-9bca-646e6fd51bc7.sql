
-- Adicionar suporte ao Apache Guacamole na tabela de integrações
-- O tipo 'guacamole' já está suportado pelo enum integration_type existente
-- Vamos apenas adicionar alguns campos específicos se necessário

-- Verificar se precisamos adicionar campos específicos para Guacamole
-- Como a tabela integrations já tem os campos necessários (base_url, username, password, api_token),
-- não precisamos modificar a estrutura da tabela

-- Apenas vamos garantir que o tipo 'guacamole' está disponível
-- (já está definido no enum integration_type)

-- Criar uma política específica para Guacamole se necessário
-- As políticas existentes já cobrem as necessidades básicas
