-- Migration para corrigir a funu00e7u00e3o de publicau00e7u00e3o de reviews
-- Criado em: 2025-04-12

-- Corrigir a funu00e7u00e3o para incluir os campos de nome e imagem do produto
CREATE OR REPLACE FUNCTION public.publish_product_reviews(product_id_param UUID)
RETURNS JSONB AS $body$
DECLARE
  reviews_json JSONB;
  avg_rating NUMERIC(3,1);
  review_count INTEGER;
  product_title TEXT;
  product_img TEXT;
BEGIN
  -- Obter informau00e7u00f5es do produto
  SELECT 
    title,
    CASE 
      WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN images[1]
      ELSE NULL
    END
  INTO
    product_title,
    product_img
  FROM
    products
  WHERE
    id = product_id_param;

  -- Obter todos os reviews selecionados e publicados do produto
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
      id, product_id, author, rating, content, 
      date, images, is_selected, is_published, created_at
    FROM reviews
    WHERE 
      product_id = product_id_param AND 
      is_selected = true AND
      is_published = true
    ORDER BY created_at DESC
  ) r;
  
  -- Se nu00e3o encontrou nenhum review, retorna array vazio
  IF reviews_json IS NULL THEN
    reviews_json := '[]'::jsonb;
    avg_rating := 0;
    review_count := 0;
  END IF;
  
  -- Insere ou atualiza o registro na tabela de reviews publicados
  INSERT INTO public.published_reviews_json 
    (product_id, reviews_data, average_rating, reviews_count, product_name, product_image)
  VALUES 
    (product_id_param, reviews_json, avg_rating, review_count, product_title, product_img)
  ON CONFLICT (product_id) 
  DO UPDATE SET 
    reviews_data = reviews_json,
    average_rating = avg_rating,
    reviews_count = review_count,
    product_name = product_title,
    product_image = product_img,
    updated_at = now();

  RETURN reviews_json;
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;
