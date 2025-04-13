-- Adiciona o campo role à tabela users (se não existir)
-- O campo será NULL por padrão, apenas usuários admin terão o valor "admin"
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT NULL;

-- Cria um índice para facilitar buscas por role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Cria política RLS para garantir que apenas admins possam acessar informações de outros usuários
CREATE POLICY IF NOT EXISTS "Admins podem ver todos os usuários" 
ON users FOR SELECT 
TO authenticated 
USING (
  (auth.uid() = id) OR 
  (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);
