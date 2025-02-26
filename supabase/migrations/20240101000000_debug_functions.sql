-- Função para criar lojas em modo de debug, contornando as políticas de RLS
CREATE OR REPLACE FUNCTION debug_create_store(store_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Isso faz com que a função execute com as permissões do criador da função
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Inserir na tabela stores diretamente
  INSERT INTO stores (
    id,
    user_id,
    name,
    platform,
    url,
    products_count,
    orders_count,
    created_at,
    updated_at
  ) VALUES (
    (store_data->>'id')::UUID,
    (store_data->>'user_id')::UUID,
    (store_data->>'name')::TEXT,
    (store_data->>'platform')::TEXT::platform_type,
    (store_data->>'url')::TEXT,
    (store_data->>'products_count')::INTEGER,
    (store_data->>'orders_count')::INTEGER,
    (store_data->>'created_at')::TIMESTAMPTZ,
    (store_data->>'updated_at')::TIMESTAMPTZ
  )
  RETURNING to_jsonb(stores.*) INTO result;
  
  RETURN json_build_object(
    'success', true,
    'store', result
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Função para buscar loja em modo de debug, contornando as políticas de RLS
CREATE OR REPLACE FUNCTION debug_get_store(store_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Isso faz com que a função execute com as permissões do criador da função
AS $$
DECLARE
  store_data stores;
BEGIN
  -- Buscar a loja diretamente
  SELECT * INTO store_data
  FROM stores
  WHERE id = store_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  RETURN to_jsonb(store_data);
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Conceder permissão para anon (usuários não autenticados) chamar as funções
GRANT EXECUTE ON FUNCTION debug_create_store TO anon;
GRANT EXECUTE ON FUNCTION debug_get_store TO anon; 