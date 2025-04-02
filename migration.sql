-- Adicionar campo para armazenar imagens da descrição separadamente
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description_images TEXT[] DEFAULT '{}'::TEXT[];

-- Criar um índice para melhorar a performance de consultas que usam description_images
CREATE INDEX IF NOT EXISTS idx_products_description_images ON products USING GIN (description_images);

-- Comentário para documentar a tabela
COMMENT ON COLUMN products.description_images IS 'Array de URLs de imagens específicas da descrição do produto';

-- Adicionar coluna language à tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt';

-- Comentário para documentar a coluna
COMMENT ON COLUMN products.language IS 'Código do idioma atual da descrição do produto (pt, en, es, etc)';

-- Código para verificar se a coluna foi criada corretamente
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'language'; 