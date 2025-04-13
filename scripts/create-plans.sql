-- Adiciona a coluna is_lifetime se não existir
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT FALSE;

-- Remove planos anteriores chamados STARTER, GROWTH ou PRO se existirem
DELETE FROM plans WHERE name IN ('STARTER', 'GROWTH', 'PRO');

-- Insere os planos corretos
INSERT INTO plans (name, description, monthly_price, annual_price, features, stores_limit, products_limit, is_lifetime, active, created_at, updated_at)
VALUES 
-- STARTER: Plano mensal com limite de 2 lojas (49.90)
('STARTER', 'Plano mensal com limite de 2 lojas', 49.90, 499.00, 
  jsonb_build_array('2 lojas', 'Produtos ilimitados', 'Suporte por email'),
  2, -1, false, true, NOW(), NOW()),

-- GROWTH: Plano semestral com limite de 5 lojas (249.90)
('GROWTH', 'Plano semestral com limite de 5 lojas', 249.90, 1499.40,
  jsonb_build_array('5 lojas', 'Produtos ilimitados', 'Suporte prioritário', 'Integração com Shopify'),
  5, -1, false, true, NOW(), NOW()),

-- PRO: Plano vitalício com limite de 5 lojas (999.90)
('PRO', 'Plano vitalício com limite de 5 lojas', 999.90, 999.90,
  jsonb_build_array('5 lojas', 'Produtos ilimitados', 'Suporte VIP', 'Integração com Shopify', 'Acesso vitalício'),
  5, -1, true, true, NOW(), NOW());

-- Visualiza os planos criados
SELECT id, name, description, monthly_price, annual_price, stores_limit, 
       products_limit, is_lifetime, features
FROM plans
WHERE name IN ('STARTER', 'GROWTH', 'PRO'); 