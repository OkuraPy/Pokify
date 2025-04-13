-- Esta migrau00e7u00e3o corrige o problema de conflito de tipos, criando uma funu00e7u00e3o
-- que aceita explicitamente UUID como paru00e2metro

-- Primeiro, vamos foru00e7ar a remou00e7u00e3o de todas as versu00f5es existentes da funu00e7u00e3o
DROP FUNCTION IF EXISTS publish_product_reviews(TEXT);
DROP FUNCTION IF EXISTS publish_product_reviews(UUID);

-- Agora, vamos criar uma versu00e3o u00fanica que aceita UUID
CREATE OR REPLACE FUNCTION publish_product_reviews(product_id_param UUID)
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
    -- Obter informau00e7u00f5es do produto
    SELECT name, image_url 
    INTO product_name, product_image
    FROM products 
    WHERE id = product_id_param;
    
    -- Obter reviews em JSON e estatu00edsticas
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
    
    -- Se nu00e3o houver reviews, criar um array vazio
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
    
    -- Verificar se ju00e1 existe um registro para este produto
    SELECT * INTO result_record FROM published_reviews_json WHERE product_id = product_id_param::TEXT;
    
    -- Inserir ou atualizar o registro
    IF result_record.product_id IS NULL THEN
        INSERT INTO published_reviews_json (product_id, json_data)
        VALUES (product_id_param::TEXT, result_json);
    ELSE
        UPDATE published_reviews_json
        SET json_data = result_json, updated_at = NOW()
        WHERE product_id = product_id_param::TEXT;
    END IF;
    
    -- Retornar o resultado com sucesso
    RETURN json_build_object('success', true, 'message', 'Reviews publicados com sucesso', 'data', result_json);

EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar mensagem de erro
    RETURN json_build_object('success', false, 'message', 'Erro ao publicar reviews: ' || SQLERRM);
END;
$$;
