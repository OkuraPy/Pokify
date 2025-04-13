-- Criar tabela de tipos de planos
CREATE TABLE IF NOT EXISTS plan_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  interval VARCHAR(20) NOT NULL CHECK (interval IN ('mensal', 'semestral', 'anual', 'vitalicio')),
  stores_limit INTEGER NOT NULL,
  is_lifetime BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de assinaturas de usuários
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_email VARCHAR(255) NOT NULL,
  plan_type_id UUID NOT NULL REFERENCES plan_types(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('ativo', 'pendente', 'expirado', 'cancelado')),
  interval VARCHAR(20) NOT NULL CHECK (interval IN ('mensal', 'semestral', 'anual', 'vitalicio')),
  start_date DATE NOT NULL,
  end_date DATE,
  manually_activated BOOLEAN DEFAULT FALSE,
  activated_by VARCHAR(50) DEFAULT 'sistema',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para buscar assinaturas por e-mail (para facilitar buscas manuais)
CREATE INDEX idx_user_subscriptions_email ON user_subscriptions(user_email);

-- Criar tabela de histórico de assinaturas
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('ativacao', 'desativacao', 'mudanca_plano', 'renovacao')),
  action_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir os planos padrão
INSERT INTO plan_types (name, description, price, interval, stores_limit, is_lifetime, active)
VALUES 
  ('STARTER', 'Plano mensal com limite de 2 lojas', 49.90, 'mensal', 2, FALSE, TRUE),
  ('GROWTH', 'Plano semestral com limite de 5 lojas', 249.90, 'semestral', 5, FALSE, TRUE),
  ('PRO', 'Plano vitalício com limite de 5 lojas', 999.90, 'vitalicio', 5, TRUE, TRUE);

-- Criar função para verificar se um usuário tem permissão para adicionar mais lojas
CREATE OR REPLACE FUNCTION can_add_store(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_limit INTEGER;
  current_stores INTEGER;
BEGIN
  -- Obter o limite de lojas do usuário
  SELECT stores_limit INTO user_limit
  FROM public.users
  WHERE id = user_id;
  
  -- Contar lojas existentes
  SELECT COUNT(*) INTO current_stores
  FROM public.stores
  WHERE user_id = $1;
  
  -- Verificar se pode adicionar mais lojas
  RETURN (current_stores < user_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 