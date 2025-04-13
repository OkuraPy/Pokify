-- Esta migração resolve o conflito entre as duas versões da função publish_product_reviews

-- Primeiro, remova todas as versões existentes da função
DROP FUNCTION IF EXISTS publish_product_reviews(TEXT);
DROP FUNCTION IF EXISTS publish_product_reviews(UUID);

-- Recrie a função com tratamento adequado de tipos
CREATE OR REPLACE FUNCTION publish_product_reviews(product_id_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    reviews_json JSON;
    avg_rating NUMERIC;
    review_count INTEGER;
    product_name TEXT;
    product_image TEXT;
    result_json JSON;
    result_record RECORD;
BEGIN
    -- Obter informações do produto
    SELECT name, image_url 
    INTO product_name, product_image
    FROM products 
    WHERE id = product_id_param;
    
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
            product_id = product_id_param AND 
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
        'product_name', product_name,
        'product_image', product_image,
        'average_rating', ROUND(avg_rating::NUMERIC, 1),
        'review_count', review_count,
        'reviews', reviews_json,
        'updated_at', NOW()
    );
    
    -- Verificar se já existe um registro para este produto
    SELECT * INTO result_record FROM published_reviews_json WHERE product_id = product_id_param;
    
    -- Inserir ou atualizar o registro
    IF result_record.product_id IS NULL THEN
        INSERT INTO published_reviews_json (product_id, json_data)
        VALUES (product_id_param, result_json);
    ELSE
        UPDATE published_reviews_json
        SET json_data = result_json, updated_at = NOW()
        WHERE product_id = product_id_param;
    END IF;
    
    -- Retornar o resultado com sucesso
    RETURN json_build_object('success', true, 'message', 'Reviews publicados com sucesso', 'data', result_json);

EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar mensagem de erro
    RETURN json_build_object('success', false, 'message', 'Erro ao publicar reviews: ' || SQLERRM);
END;
$$;
