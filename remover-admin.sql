-- Remover a política RLS restritiva que foi criada
DROP POLICY IF EXISTS "Admins podem ver todos os usuários" ON users;

-- Remover a coluna role que foi adicionada
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Remover o índice criado para a coluna role
DROP INDEX IF EXISTS idx_users_role;

-- Remover a política existente (se houver) antes de tentar criar uma nova
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os usuários" ON users;

-- Criar uma política permissiva para a tabela users (para garantir acesso)
CREATE POLICY "Usuários autenticados podem ver todos os usuários" 
ON users FOR SELECT 
TO authenticated 
USING (true);

-- Remover e recriar políticas da tabela review_configs
DROP POLICY IF EXISTS "Usuários só podem acessar suas próprias configurações" ON review_configs;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar configurações de reviews" ON review_configs;

-- Criar política permissiva para review_configs (permite todas as operações)
CREATE POLICY "Usuários autenticados podem gerenciar configurações de reviews" 
ON review_configs FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Verificar se precisamos habilitar RLS para as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_configs ENABLE ROW LEVEL SECURITY; 