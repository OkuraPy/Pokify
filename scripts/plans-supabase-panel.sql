-- Esse SQL deve ser colado no editor SQL do Supabase e executado
-- Para acessar: Abra o painel do Supabase > SQL Editor > New Query

-- Adiciona a coluna is_lifetime se não existir
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT FALSE;

-- Vamos usar UUIDs para os planos para garantir compatibilidade
DO $$
DECLARE
    starter_id UUID := uuid_generate_v4();
    growth_id UUID := uuid_generate_v4();
    pro_id UUID := uuid_generate_v4();
BEGIN
    -- Remove planos anteriores com os mesmos nomes, se existirem
    DELETE FROM plans WHERE name IN ('STARTER', 'GROWTH', 'PRO');
    
    -- Insere os planos corretos
    -- STARTER: Plano mensal com limite de 2 lojas (49.90)
    INSERT INTO plans (id, name, description, monthly_price, annual_price, features, stores_limit, products_limit, is_lifetime, active, created_at, updated_at)
    VALUES (
        starter_id,
        'STARTER', 
        'Plano mensal com limite de 2 lojas',
        49.90, 
        499.00, 
        jsonb_build_array('2 lojas', 'Produtos ilimitados', 'Suporte por email'),
        2, 
        -1, 
        false, 
        true, 
        NOW(), 
        NOW()
    );
    
    -- GROWTH: Plano semestral com limite de 5 lojas (249.90)
    INSERT INTO plans (id, name, description, monthly_price, annual_price, features, stores_limit, products_limit, is_lifetime, active, created_at, updated_at)
    VALUES (
        growth_id,
        'GROWTH', 
        'Plano semestral com limite de 5 lojas',
        249.90, 
        1499.40, 
        jsonb_build_array('5 lojas', 'Produtos ilimitados', 'Suporte prioritário', 'Integração com Shopify'),
        5, 
        -1, 
        false, 
        true, 
        NOW(), 
        NOW()
    );
    
    -- PRO: Plano vitalício com limite de 5 lojas (999.90)
    INSERT INTO plans (id, name, description, monthly_price, annual_price, features, stores_limit, products_limit, is_lifetime, active, created_at, updated_at)
    VALUES (
        pro_id,
        'PRO', 
        'Plano vitalício com limite de 5 lojas',
        999.90, 
        999.90, 
        jsonb_build_array('5 lojas', 'Produtos ilimitados', 'Suporte VIP', 'Integração com Shopify', 'Acesso vitalício'),
        5, 
        -1, 
        true, 
        true, 
        NOW(), 
        NOW()
    );
    
    -- Log para debug
    RAISE NOTICE 'Planos criados com IDs: STARTER=%', starter_id;
    RAISE NOTICE 'Planos criados com IDs: GROWTH=%', growth_id;
    RAISE NOTICE 'Planos criados com IDs: PRO=%', pro_id;
END $$;

-- Visualiza os planos criados
SELECT id, name, description, monthly_price, annual_price, stores_limit, 
       products_limit, is_lifetime, features
FROM plans
WHERE name IN ('STARTER', 'GROWTH', 'PRO'); 