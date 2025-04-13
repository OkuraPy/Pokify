-- SQL para adicionar planos semestral e vitalício
-- Inserir plano semestral (GROWTH)
INSERT INTO plans (id, name, description, monthly_price, annual_price, period_type, is_lifetime, active, features, stores_limit, products_limit, created_at, updated_at)
VALUES (
  gen_random_uuid(), -- ID gerado automaticamente
  'GROWTH', -- Nome do plano
  'Plano semestral com todos os recursos essenciais', -- Descrição
  49.90, -- Preço mensal (equivalente)
  269.40, -- Preço para 6 meses (usado como preço anual)
  'SEMI_ANNUAL', -- Tipo de período
  false, -- Não é vitalício
  true, -- Ativo
  ARRAY['5 lojas', '1000 produtos por loja', 'Suporte prioritário', 'Extração de produtos ilimitada'], -- Recursos
  5, -- Limite de lojas
  1000, -- Limite de produtos
