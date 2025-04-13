-- Adiciona coluna is_lifetime se não existir
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT FALSE;

-- Define todos os planos com produtos ilimitados
UPDATE plans SET products_limit = -1 WHERE products_limit IS NOT NULL;

-- Atualiza as features de todos os planos para mostrar "Produtos ilimitados"
UPDATE plans 
SET features = 
  CASE 
    WHEN id = 'e4438651-8994-4917-8c0f-c6718efa50fd' THEN 
      jsonb_build_array('1 loja', 'Produtos ilimitados', 'Suporte por email')
    WHEN id = '947a9f35-0797-44c6-accf-e8c98c9b4b51' THEN
      jsonb_build_array('3 lojas', 'Produtos ilimitados', 'Suporte prioritário', 'Integração com Shopify', 'Acesso vitalício')
    WHEN id = '9d04bac4-7882-450e-a924-f28bc4c9fe2b' THEN
      jsonb_build_array('10 lojas', 'Produtos ilimitados', 'Suporte VIP', 'Integração com Shopify', 'Análise avançada')
    ELSE features
  END;

-- Define o plano Pro como vitalício
UPDATE plans SET is_lifetime = TRUE WHERE id = '947a9f35-0797-44c6-accf-e8c98c9b4b51';

-- Atualiza descrições
UPDATE plans 
SET description = 
  CASE 
    WHEN id = '947a9f35-0797-44c6-accf-e8c98c9b4b51' THEN 'Plano vitalício com 3 lojas e produtos ilimitados'
    ELSE description
  END; 