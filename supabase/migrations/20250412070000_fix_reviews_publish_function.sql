-- Primeiro, vamos limpar todas as versões anteriores da função
DROP FUNCTION IF EXISTS publish_product_reviews(TEXT);
DROP FUNCTION IF EXISTS publish_product_reviews(UUID);

-- Agora, vamos criar uma versão unificada da função
CREATE OR REPLACE FUNCTION publish_product_reviews(product_id_param TEXT)
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
    INTO product_title, product_img
    FROM products 
    WHERE id = final_product_id;
    
    -- Obter reviews em JSON e estatísticas
    WITH review_stats AS (
        SELECT 
            json_agg(r ORDER BY r.date DESC, r.created_at DESC) as reviews,
            COALESCE(AVG(r.rating), 0) as avg_rating,
            COUNT(r.id) as total_count
        FROM (
            SELECT 
                id, 
                author,
                content,
                rating,
                date,
                images,
                created_at
            FROM 
                reviews
            WHERE 
                product_id = final_product_id AND 
                is_selected = true AND
                is_published = true
        ) r
    )
    SELECT 
        COALESCE(reviews, '[]'::jsonb),
        COALESCE(avg_rating, 0),
        COALESCE(total_count, 0)
    INTO 
        reviews_json,
        avg_rating,
        review_count
    FROM review_stats;

    -- Criar objeto JSON final
    result_json := jsonb_build_object(
        'reviews', reviews_json,
        'product_id', final_product_id,
        'product_name', product_title,
        'product_image', product_img,
        'average_rating', ROUND(avg_rating::NUMERIC, 1),
        'review_count', review_count,
        'updated_at', NOW()
    );
    
    -- Inserir ou atualizar o registro na tabela published_reviews_json
    INSERT INTO published_reviews_json (
        product_id,
        reviews_data,
        average_rating,
        reviews_count,
        product_name,
        product_image,
        updated_at
    )
    VALUES (
        final_product_id,
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