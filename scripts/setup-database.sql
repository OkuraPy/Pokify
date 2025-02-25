-- Script de configuração do banco de dados Pokify
-- Execute este script no Console SQL do Supabase

-- Habilitar a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para status do produto
CREATE TYPE IF NOT EXISTS product_status AS ENUM (
  'imported',      -- Produto recém importado
  'editing',       -- Em edição
  'ready',         -- Pronto para publicação
  'published',     -- Publicado na loja
  'archived'       -- Arquivado/Inativo
);

-- Enum para plataforma de origem
CREATE TYPE IF NOT EXISTS platform_type AS ENUM (
  'aliexpress',
  'shopify',
  'other'
);

-- Tabela de Usuários (estende a tabela auth.users do Supabase)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  billing_status TEXT DEFAULT 'free',
  stores_limit INTEGER DEFAULT 1,
  products_limit INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Função para criar automaticamente um perfil de usuário
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil após signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_user_profile();

-- Tabela de Lojas (Stores)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  platform platform_type NOT NULL,
  url TEXT,
  api_key TEXT,
  api_secret TEXT,
  api_version TEXT,
  products_count INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  images TEXT[],
  original_url TEXT,
  original_platform platform_type,
  shopify_product_id TEXT,
  shopify_product_url TEXT,
  stock INTEGER DEFAULT 0,
  status product_status DEFAULT 'imported',
  reviews_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  tags TEXT[],
  variants JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Avaliações (Reviews)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) NOT NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  date TEXT,
  images TEXT[],
  is_selected BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Histórico de Publicações
CREATE TABLE IF NOT EXISTS publication_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) NOT NULL,
  store_id UUID REFERENCES stores(id) NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT,
  shopify_response JSONB
);

-- Configurações do Usuário
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID REFERENCES users(id) PRIMARY KEY,
  default_language TEXT DEFAULT 'pt-BR',
  auto_translate BOOLEAN DEFAULT true,
  auto_enhance BOOLEAN DEFAULT true,
  default_store UUID REFERENCES stores(id),
  ui_preferences JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

-- Políticas de Segurança (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Política para usuários acessarem apenas seus próprios dados
DROP POLICY IF EXISTS user_select_own ON users;
CREATE POLICY user_select_own ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS user_update_own ON users;
CREATE POLICY user_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Política para lojas
DROP POLICY IF EXISTS stores_select_own ON stores;
CREATE POLICY stores_select_own ON stores
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS stores_insert_own ON stores;
CREATE POLICY stores_insert_own ON stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS stores_update_own ON stores;
CREATE POLICY stores_update_own ON stores
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS stores_delete_own ON stores;
CREATE POLICY stores_delete_own ON stores
  FOR DELETE USING (auth.uid() = user_id);

-- Política para produtos
DROP POLICY IF EXISTS products_select_own ON products;
CREATE POLICY products_select_own ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS products_insert_own ON products;
CREATE POLICY products_insert_own ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS products_update_own ON products;
CREATE POLICY products_update_own ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS products_delete_own ON products;
CREATE POLICY products_delete_own ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Política para avaliações
DROP POLICY IF EXISTS reviews_select_own ON reviews;
CREATE POLICY reviews_select_own ON reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON products.store_id = stores.id
      WHERE products.id = reviews.product_id
      AND stores.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS reviews_insert_own ON reviews;
CREATE POLICY reviews_insert_own ON reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON products.store_id = stores.id
      WHERE products.id = reviews.product_id
      AND stores.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS reviews_update_own ON reviews;
CREATE POLICY reviews_update_own ON reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON products.store_id = stores.id
      WHERE products.id = reviews.product_id
      AND stores.user_id = auth.uid()
    )
  );

-- Funções para atualizar count e timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON stores
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Funções para gerenciar contadores
CREATE OR REPLACE FUNCTION increment_store_products_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stores
  SET products_count = products_count + 1
  WHERE id = NEW.store_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_store_products_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stores
  SET products_count = products_count - 1
  WHERE id = OLD.store_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers para contagem de produtos
DROP TRIGGER IF EXISTS on_product_created ON products;
CREATE TRIGGER on_product_created
AFTER INSERT ON products
FOR EACH ROW EXECUTE PROCEDURE increment_store_products_count();

DROP TRIGGER IF EXISTS on_product_deleted ON products;
CREATE TRIGGER on_product_deleted
AFTER DELETE ON products
FOR EACH ROW EXECUTE PROCEDURE decrement_store_products_count();

-- Função para atualizar estatísticas de reviews
CREATE OR REPLACE FUNCTION update_product_reviews_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar contagem e média de avaliações
  UPDATE products
  SET 
    reviews_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id),
    average_rating = (SELECT AVG(rating) FROM reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas de reviews
DROP TRIGGER IF EXISTS on_review_changed ON reviews;
CREATE TRIGGER on_review_changed
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE PROCEDURE update_product_reviews_stats();

-- Criar um usuário teste para desenvolvimento
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teste@pokify.com') THEN
    INSERT INTO auth.users (
      id, 
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(), 
      'teste@pokify.com',
      crypt('senha123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Usuário Teste", "avatar_url": "https://ui-avatars.com/api/?name=Usuario+Teste&background=0D8ABC&color=fff"}',
      now(),
      now()
    );
  END IF;
END
$$; 