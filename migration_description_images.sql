-- Adicionar coluna description_images à tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description_images TEXT[] DEFAULT '{}'::TEXT[];

-- Comentário para documentar a coluna
COMMENT ON COLUMN products.description_images IS 'Array de URLs de imagens encontradas na descrição do produto';

-- Código para verificar se a coluna foi criada corretamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'description_images'; 