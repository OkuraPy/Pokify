-- Adicionar restrição UNIQUE à tabela existente
ALTER TABLE public.published_reviews_json 
ADD CONSTRAINT published_reviews_json_product_id_unique UNIQUE (product_id);
