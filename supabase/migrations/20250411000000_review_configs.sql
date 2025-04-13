-- Migração para criação e melhoria da tabela review_configs
-- Criado em: 11/04/2025

-- Verificar se a tabela já existe e criar ou modificar conforme necessário
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'review_configs') THEN
    -- A tabela já existe, então vamos apenas adicionar/modificar colunas
    -- Verificar e adicionar coluna id se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'review_configs' AND column_name = 'id') THEN
      ALTER TABLE review_configs ADD COLUMN id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
    END IF;
    
    -- Verificar e adicionar coluna product_id se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'review_configs' AND column_name = 'product_id') THEN
      ALTER TABLE review_configs ADD COLUMN product_id UUID REFERENCES products(id);
    END IF;
    
    -- Verificar e adicionar coluna user_id se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'review_configs' AND column_name = 'user_id') THEN
      ALTER TABLE review_configs ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
    
    -- Verificar e adicionar coluna css_selector se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'review_configs' AND column_name = 'css_selector') THEN
      ALTER TABLE review_configs ADD COLUMN css_selector TEXT;
    END IF;
    
    -- Verificar e adicionar coluna display_format se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'review_configs' AND column_name = 'display_format') THEN
      ALTER TABLE review_configs ADD COLUMN display_format TEXT DEFAULT 'default';
    END IF;
    
    -- Verificar e adicionar coluna created_at se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'review_configs' AND column_name = 'created_at') THEN
      ALTER TABLE review_configs ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    -- Verificar e adicionar coluna updated_at se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'review_configs' AND column_name = 'updated_at') THEN
      ALTER TABLE review_configs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
  ELSE
    -- A tabela não existe, vamos criá-la do zero
    CREATE TABLE review_configs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id UUID REFERENCES products(id),
      user_id UUID REFERENCES users(id),
      shop_domain TEXT NOT NULL,
      css_selector TEXT,
      display_format TEXT DEFAULT 'default',
      review_position TEXT NOT NULL DEFAULT 'apos_descricao',
      custom_selector TEXT DEFAULT '',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;

  -- Habilitar RLS (Row Level Security) na tabela
  ALTER TABLE review_configs ENABLE ROW LEVEL SECURITY;
END
$$;

-- Criar função para atualização do campo updated_at
CREATE OR REPLACE FUNCTION update_review_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover o trigger se já existir
DROP TRIGGER IF EXISTS set_review_configs_updated_at ON review_configs;

-- Criar o trigger
CREATE TRIGGER set_review_configs_updated_at
BEFORE UPDATE ON review_configs
FOR EACH ROW
EXECUTE FUNCTION update_review_configs_updated_at();

-- Adicionar políticas de segurança para a tabela review_configs
DROP POLICY IF EXISTS review_configs_select_own ON review_configs;
CREATE POLICY review_configs_select_own ON review_configs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS review_configs_insert_own ON review_configs;
CREATE POLICY review_configs_insert_own ON review_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS review_configs_update_own ON review_configs;
CREATE POLICY review_configs_update_own ON review_configs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS review_configs_delete_own ON review_configs;
CREATE POLICY review_configs_delete_own ON review_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_review_configs_product_id ON review_configs(product_id);
CREATE INDEX IF NOT EXISTS idx_review_configs_user_id ON review_configs(user_id);
