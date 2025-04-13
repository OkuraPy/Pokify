-- Remover as políticas RLS que estão causando problemas
DROP POLICY IF EXISTS "Admins podem ver todos os usuários" ON users;
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os usuários" ON users;

-- Criar política permissiva para a tabela users
CREATE POLICY "Usuários autenticados podem ver todos os usuários" 
ON users FOR SELECT 
TO authenticated 
USING (true);

-- Remover a coluna role que foi adicionada recentemente
ALTER TABLE users DROP COLUMN IF EXISTS role;
DROP INDEX IF EXISTS idx_users_role;

-- Verificar e corrigir políticas para a tabela review_configs
DROP POLICY IF EXISTS "Usuários só podem acessar suas próprias configurações" ON review_configs;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar configurações de reviews" ON review_configs;

-- Criar política aberta para review_configs (permite todas as operações para usuários autenticados)
CREATE POLICY "Usuários autenticados podem gerenciar configurações de reviews" 
ON review_configs FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Atualizar a função publish_product_reviews que estava funcionando antes
-- Primeiro, vamos limpar todas as versões anteriores da função para evitar conflitos
DROP FUNCTION IF EXISTS publish_product_reviews(TEXT);
DROP FUNCTION IF EXISTS publish_product_reviews(UUID);

-- Agora, vamos criar uma versão unificada da função que aceita TEXT
-- e faz o cast adequado para UUID internamente
CREATE OR REPLACE FUNCTION publish_product_reviews(product_id_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    reviews_json JSON;
    avg_rating NUMERIC;
    review_count INTEGER;
    product_title TEXT;
    product_image TEXT;
    result_json JSON;
    result_record RECORD;
    final_product_id UUID;
BEGIN
    -- Converter o ID do produto para UUID com segurança
    BEGIN
        final_product_id := product_id_param::UUID;
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'ID do produto inválido: ' || product_id_param || ' não é um UUID válido'
        );
    END;

    -- Obter informações do produto
    SELECT title, 
           CASE 
               WHEN images IS NOT NULL AND array_length(images, 1) > 0 
               THEN images[1] 
               ELSE NULL 
           END AS first_image
    INTO product_title, product_image
    FROM products 
    WHERE id = final_product_id;
    
    -- Obter reviews em JSON e estatísticas
    SELECT 
        json_agg(r),
        COALESCE(AVG(r.rating), 0),
        COUNT(r.id) 
    INTO 
        reviews_json, 
        avg_rating, 
        review_count
    FROM (
        SELECT 
            id, 
            author,
            content,
            rating::INTEGER,
            date,
            images,
            created_at
        FROM 
            reviews
        WHERE 
            product_id = final_product_id AND 
            is_selected = true AND
            is_published = true
        ORDER BY
            date DESC,
            created_at DESC
    ) AS r;
    
    -- Se não houver reviews, criar um array vazio
    IF reviews_json IS NULL THEN
        reviews_json := '[]'::JSON;
    END IF;
    
    -- Criar objeto JSON final
    result_json := json_build_object(
        'product_id', product_id_param,
        'product_name', product_title,
        'product_image', product_image,
        'average_rating', ROUND(avg_rating::NUMERIC, 1),
        'review_count', review_count,
        'reviews', reviews_json,
        'updated_at', NOW()
    );
    
    -- Verificar se já existe um registro para este produto
    SELECT * INTO result_record 
    FROM published_reviews_json 
    WHERE product_id = final_product_id;
    
    -- Inserir ou atualizar o registro
    IF result_record.product_id IS NULL THEN
        -- CORREÇÃO: Usar reviews_data em vez de json_data
        INSERT INTO published_reviews_json (
            product_id, 
            reviews_data, 
            average_rating, 
            reviews_count, 
            updated_at,
            product_name,
            product_image
        )
        VALUES (
            final_product_id, 
            result_json, 
            ROUND(avg_rating::NUMERIC, 1), 
            review_count, 
            NOW(),
            product_title,
            product_image
        );
    ELSE
        -- CORREÇÃO: Usar reviews_data em vez de json_data
        UPDATE published_reviews_json
        SET 
            reviews_data = result_json, 
            average_rating = ROUND(avg_rating::NUMERIC, 1),
            reviews_count = review_count,
            updated_at = NOW(),
            product_name = product_title,
            product_image = product_image
        WHERE product_id = final_product_id;
    END IF;
    
    -- Retornar o resultado com sucesso
    RETURN json_build_object(
        'success', true, 
        'message', 'Reviews publicados com sucesso', 
        'data', result_json
    );

EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar mensagem de erro
    RETURN json_build_object(
        'success', false, 
        'message', 'Erro ao publicar reviews: ' || SQLERRM
    );
END;
$$; 