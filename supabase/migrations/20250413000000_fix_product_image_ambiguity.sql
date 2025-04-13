-- Migração para corrigir o problema de ambiguidade da coluna product_image 
-- Criado em: 2025-04-13

-- 1. Primeiro, vamos limpar todas as versões anteriores da função
DROP FUNCTION IF EXISTS publish_product_reviews(TEXT);
DROP FUNCTION IF EXISTS publish_product_reviews(UUID);

-- 2. Criar nova versão da função que resolve a ambiguidade da coluna
CREATE OR REPLACE FUNCTION public.publish_product_reviews(product_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    reviews_json JSONB;
    avg_rating NUMERIC;
    review_count INTEGER;
    product_title TEXT;
    product_img TEXT;
    result_json JSONB;
BEGIN
    -- Obter informações do produto
    SELECT 
        title, 
        CASE 
            WHEN images IS NOT NULL AND array_length(images, 1) > 0 
            THEN images[1] 
            ELSE NULL 
        END AS first_image
    INTO
        product_title, 
        product_img
    FROM 
        products 
    WHERE 
        id = product_id_param;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Produto não encontrado'
        );
    END IF;
    
    -- Obter reviews em JSON e estatísticas
    WITH review_stats AS (
        SELECT 
            json_agg(
                json_build_object(
                    'id', r.id,
                    'author', r.author,
                    'content', r.content,
                    'rating', r.rating,
                    'date', r.date,
                    'images', r.images,
                    'created_at', r.created_at
                )
                ORDER BY r.date DESC, r.created_at DESC
            ) as reviews,
            COALESCE(AVG(r.rating), 0) as avg_rating,
            COUNT(r.id) as total_count
        FROM 
            reviews r
        WHERE 
            r.product_id = product_id_param AND 
            r.is_selected = true AND
            r.is_published = true
    )
    SELECT 
        COALESCE(reviews, '[]'::jsonb),
        COALESCE(avg_rating, 0),
        COALESCE(total_count, 0)
    INTO 
        reviews_json,
        avg_rating,
        review_count
    FROM 
        review_stats;

    -- Criar objeto JSON final
    result_json := jsonb_build_object(
        'product_id', product_id_param,
        'product_name', product_title,
        'product_image', product_img,
        'average_rating', ROUND(avg_rating::NUMERIC, 1),
        'review_count', review_count,
        'reviews', reviews_json,
        'updated_at', NOW()
    );
    
    -- Inserir ou atualizar o registro na tabela published_reviews_json
    -- Aqui usamos os aliases nas colunas para evitar ambiguidade
    INSERT INTO published_reviews_json AS prj (
        product_id,
        reviews_data,
        average_rating,
        reviews_count,
        product_name,
        product_image,
        updated_at
    )
    VALUES (
        product_id_param,
        result_json,
        ROUND(avg_rating::NUMERIC, 1),
        review_count,
        product_title,
        product_img,
        NOW()
    )
    ON CONFLICT (product_id) 
    DO UPDATE SET 
        reviews_data = EXCLUDED.reviews_data,
        average_rating = EXCLUDED.average_rating,
        reviews_count = EXCLUDED.reviews_count,
        product_name = EXCLUDED.product_name,
        product_image = EXCLUDED.product_image,
        updated_at = NOW();

    -- Retornar sucesso
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

-- 3. Fazer um teste para confirmar que a função agora funciona
-- (Comentado para não executar automaticamente)
-- SELECT publish_product_reviews('2486825c-6e29-4793-9758-47d8b225ebe7'::UUID); 