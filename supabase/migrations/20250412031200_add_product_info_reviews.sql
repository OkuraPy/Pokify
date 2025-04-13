-- Migration para adicionar informações do produto à tabela published_reviews_json
-- Criado em: 2025-04-12

-- Adicionar colunas para nome e imagem do produto
ALTER TABLE public.published_reviews_json
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS product_image TEXT;

-- Atualizar as entradas existentes com os dados dos produtos
UPDATE public.published_reviews_json prj
SET 
  product_name = p.title,
  product_image = CASE 
    WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 THEN p.images[1]
    ELSE NULL
  END
FROM public.products p
WHERE prj.product_id = p.id;
