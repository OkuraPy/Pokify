-- SQL para adicionar manualmente uma assinatura do plano STARTER para o usuário
INSERT INTO subscriptions (
  id,
  user_id,
  plan_id,
  asaas_customer_id,
  asaas_subscription_id,
  status,
  cycle,
  next_payment_date,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Gera um UUID aleatório para o ID
  'aa5d2264-64e6-44f6-93d6-7061d8391f85', -- ID do usuário fornecido
  'd8daa324-3d65-48a4-8ec4-aca5d75e7d98', -- ID do plano STARTER
  'customer_manual', -- Valor simulado para asaas_customer_id
  'subscription_manual', -- Valor simulado para asaas_subscription_id
  'active', -- Status: active
  'monthly', -- Ciclo: monthly
  CURRENT_DATE + INTERVAL '30 days', -- Próxima data de pagamento (30 dias a partir de hoje)
  NOW(), -- Data de criação (agora)
  NOW() -- Data de atualização (agora)
);

