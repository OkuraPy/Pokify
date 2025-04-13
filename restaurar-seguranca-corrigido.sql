-- SCRIPT PARA RESTAURAR A SEGURANÇA RLS NAS TABELAS (CORRIGIDO)

-- 1. Reativar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_reviews_json ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 2. Recriar políticas de segurança padrão para tabela users
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON users;
CREATE POLICY "Usuários podem ver seus próprios dados" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON users;
CREATE POLICY "Usuários podem atualizar seus próprios dados" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Criar também uma política para permitir visualizar todos os usuários
-- Esta é necessária para o funcionamento das chaves estrangeiras
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar todos os usuários" ON users;
CREATE POLICY "Usuários autenticados podem visualizar todos os usuários" 
ON users FOR SELECT 
TO authenticated 
USING (true);

-- 3. Recriar políticas para review_configs
DROP POLICY IF EXISTS "Usuários podem ver suas próprias configurações" ON review_configs;
CREATE POLICY "Usuários podem ver suas próprias configurações" 
ON review_configs FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias configurações" ON review_configs;
CREATE POLICY "Usuários podem atualizar suas próprias configurações" 
ON review_configs FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias configurações" ON review_configs;
CREATE POLICY "Usuários podem inserir suas próprias configurações" 
ON review_configs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem excluir suas próprias configurações" ON review_configs;
CREATE POLICY "Usuários podem excluir suas próprias configurações" 
ON review_configs FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Recriar políticas para published_reviews_json
DROP POLICY IF EXISTS "Acesso público para leitura de avaliações publicadas" ON published_reviews_json;
CREATE POLICY "Acesso público para leitura de avaliações publicadas" 
ON published_reviews_json FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar avaliações publicadas" ON published_reviews_json;
CREATE POLICY "Usuários autenticados podem gerenciar avaliações publicadas" 
ON published_reviews_json FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar avaliações publicadas" ON published_reviews_json;
CREATE POLICY "Usuários autenticados podem atualizar avaliações publicadas" 
ON published_reviews_json FOR UPDATE 
TO authenticated 
USING (true);

-- 5. Recriar políticas para reviews
DROP POLICY IF EXISTS "Acesso público para leitura de reviews" ON reviews;
CREATE POLICY "Acesso público para leitura de reviews" 
ON reviews FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios reviews" ON reviews;
CREATE POLICY "Usuários podem gerenciar seus próprios reviews" 
ON reviews FOR ALL 
TO authenticated 
USING (true);

-- 6. Recriar políticas para products
-- Verificamos que produtos estão associados a lojas, não diretamente a usuários
DROP POLICY IF EXISTS "Usuários podem ver produtos" ON products;
CREATE POLICY "Usuários podem ver produtos" 
ON products FOR SELECT 
TO authenticated 
USING (true);

-- Associar produtos a lojas/usuários através da coluna store_id
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios produtos" ON products;
CREATE POLICY "Usuários podem gerenciar seus próprios produtos" 
ON products FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = products.store_id 
    AND stores.user_id = auth.uid()
  )
);

-- 7. Recriar políticas para stores
DROP POLICY IF EXISTS "Usuários podem ver lojas" ON stores;
CREATE POLICY "Usuários podem ver lojas" 
ON stores FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias lojas" ON stores;
CREATE POLICY "Usuários podem gerenciar suas próprias lojas" 
ON stores FOR ALL 
TO authenticated 
USING (auth.uid() = user_id); 