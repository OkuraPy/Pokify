-- SCRIPT COMPLETO PARA RESOLVER PROBLEMAS DE RLS E PERMISSÕES NO SUPABASE

-- 1. Desativar RLS temporariamente para facilitar o debug
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE review_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE published_reviews_json DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas restritivas
DROP POLICY IF EXISTS "Admins podem ver todos os usuários" ON users;
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os usuários" ON users;
DROP POLICY IF EXISTS "Usuários só podem acessar suas próprias configurações" ON review_configs;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar configurações de reviews" ON review_configs;

-- 3. Remover a coluna role que foi adicionada
ALTER TABLE users DROP COLUMN IF EXISTS role;
DROP INDEX IF EXISTS idx_users_role;

-- 4. Reativar RLS para as tabelas principais
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_reviews_json ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas permissivas para todas as tabelas principais
-- Para users
CREATE POLICY "Acesso público para usuários autenticados" ON users
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios dados" ON users
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Para review_configs - política bem permissiva para evitar problemas
CREATE POLICY "Acesso total para usuários autenticados" ON review_configs
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Para published_reviews_json - acesso público
CREATE POLICY "Acesso público para leitura" ON published_reviews_json
FOR SELECT USING (true);

CREATE POLICY "Apenas usuários autenticados podem modificar" ON published_reviews_json
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Para reviews
CREATE POLICY "Acesso público para leitura de reviews" ON reviews
FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar reviews" ON reviews
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Para products
CREATE POLICY "Acesso público para leitura de produtos" ON products
FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar produtos" ON products
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Para stores
CREATE POLICY "Acesso público para leitura de lojas" ON stores
FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar lojas" ON stores
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Verificar e corrigir funções RPC se necessário
-- A função publish_product_reviews será tratada em um script separado se necessário 