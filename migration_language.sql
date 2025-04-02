-- Adicionar coluna language à tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt';

-- Comentário para documentar a coluna
COMMENT ON COLUMN products.language IS 'Código do idioma atual da descrição do produto (pt, en, es, etc)';

-- Código para verificar se a coluna foi criada corretamente
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'language'; 