-- Migration para criar tabela de reviews publicados em formato JSON
-- Criado em: 2025-04-12

-- Criar a tabela que vai armazenar os reviews publicados em formato JSON
CREATE TABLE IF NOT EXISTS public.published_reviews_json (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviews_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  average_rating NUMERIC(3,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id)
);

-- Índice para busca por product_id
CREATE INDEX IF NOT EXISTS published_reviews_json_product_id_idx ON public.published_reviews_json(product_id);

-- Trigger para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_published_reviews_json_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_published_reviews_json_updated_at ON public.published_reviews_json;
CREATE TRIGGER update_published_reviews_json_updated_at
BEFORE UPDATE ON public.published_reviews_json
FOR EACH ROW
EXECUTE FUNCTION update_published_reviews_json_updated_at();

-- Política de segurança para permitir leitura pública
ALTER TABLE public.published_reviews_json ENABLE ROW LEVEL SECURITY;

-- Política que permite a leitura pública (sem restrições)
DROP POLICY IF EXISTS published_reviews_json_select_policy ON public.published_reviews_json;
CREATE POLICY published_reviews_json_select_policy ON public.published_reviews_json
FOR SELECT TO public USING (true);

-- Política que permite inserção e atualização apenas pelo dono do produto
DROP POLICY IF EXISTS published_reviews_json_insert_update_policy ON public.published_reviews_json;
CREATE POLICY published_reviews_json_insert_update_policy ON public.published_reviews_json
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    JOIN stores ON products.store_id = stores.id
    WHERE products.id = published_reviews_json.product_id
    AND stores.user_id = auth.uid()
  )
);

-- Função para publicar reviews selecionados
CREATE OR REPLACE FUNCTION public.publish_product_reviews(product_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reviews_json JSONB;
  avg_rating NUMERIC(3,1);
  review_count INTEGER;
BEGIN
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
  
  -- Se não encontrou nenhum review, retorna array vazio
  IF reviews_json IS NULL THEN
    reviews_json := '[]'::jsonb;
    avg_rating := 0;
    review_count := 0;
  END IF;
  
  -- Insere ou atualiza o registro na tabela de reviews publicados
  INSERT INTO public.published_reviews_json 
    (product_id, reviews_data, average_rating, reviews_count)
  VALUES 
    (product_id_param, reviews_json, avg_rating, review_count)
  ON CONFLICT (product_id) 
  DO UPDATE SET 
    reviews_data = reviews_json,
    average_rating = avg_rating,
    reviews_count = review_count,
    updated_at = now();
    
  RETURN reviews_json;
END;
$$;
