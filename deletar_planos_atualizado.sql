-- SQL para excluir os planos e suas assinaturas relacionadas
-- Passo 1: Excluir assinaturas vinculadas a esses planos
DELETE FROM subscriptions
WHERE plan_id IN (
  'e4438651-8994-4917-8c0f-c6718efa50fd',
  '9d04bac4-7882-450e-a924-f28bc4c9fe2b',
  '947a9f35-0797-44c6-accf-e8c98c9b4b51'
);

-- Passo 2: Agora excluir os planos
DELETE FROM plans
WHERE id IN (
  'e4438651-8994-4917-8c0f-c6718efa50fd',
  '9d04bac4-7882-450e-a924-f28bc4c9fe2b',
  '947a9f35-0797-44c6-accf-e8c98c9b4b51'
);
