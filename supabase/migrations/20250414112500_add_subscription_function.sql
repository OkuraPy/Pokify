-- Adiciona função para obter informações da assinatura atual de um usuário
CREATE OR REPLACE FUNCTION get_user_subscription(user_id_param UUID)
RETURNS TABLE(
  id UUID,
  status TEXT,
  cycle TEXT,
  plan_name TEXT,
  plan_description TEXT,
  is_lifetime BOOLEAN,
  created_at TIMESTAMPTZ,
  next_payment_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.status,
    s.cycle,
    p.name AS plan_name,
    p.description AS plan_description,
    p.is_lifetime,
    s.created_at,
    s.next_payment_date
  FROM 
    subscriptions s
  JOIN 
    plans p ON s.plan_id = p.id
  WHERE 
    s.user_id = user_id_param
    AND s.status = 'active'
  ORDER BY 
    s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concede permissão para anônimos chamarem a função
GRANT EXECUTE ON FUNCTION get_user_subscription(UUID) TO anon, authenticated, service_role;
