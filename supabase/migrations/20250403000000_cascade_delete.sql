-- Migração para adicionar função de exclusão em cascata segura
-- Criada em: 03/04/2025

-- Função para excluir uma loja e todas as suas dependências de forma segura
CREATE OR REPLACE FUNCTION cascade_delete_store(store_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com as permissões do criador da função
AS $$
DECLARE
  product_count INTEGER;
  message TEXT;
BEGIN
  -- Iniciar transação
  BEGIN;
    
    -- 1. Remover todas as avaliações dos produtos da loja
    DELETE FROM reviews
    WHERE product_id IN (SELECT id FROM products WHERE store_id = store_id_param);
    
    -- 2. Remover histórico de publicação dos produtos
    DELETE FROM publication_history
    WHERE product_id IN (SELECT id FROM products WHERE store_id = store_id_param);
    
    -- 3. Remover histórico de publicação da loja
    DELETE FROM publication_history
    WHERE store_id = store_id_param;
    
    -- 4. Contar quantos produtos foram afetados
    SELECT COUNT(*) INTO product_count
    FROM products
    WHERE store_id = store_id_param;
    
    -- 5. Excluir todos os produtos
    DELETE FROM products
    WHERE store_id = store_id_param;
    
    -- 6. Excluir a loja
    DELETE FROM stores
    WHERE id = store_id_param;
    
    -- Confirmar transação
    COMMIT;
    
    message := 'Loja excluída com sucesso. ' || product_count || ' produtos removidos.';
    RETURN json_build_object('success', true, 'message', message, 'products_deleted', product_count);
    
  EXCEPTION WHEN OTHERS THEN
    -- Reverter a transação em caso de erro
    ROLLBACK;
    RETURN json_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;

-- Conceder permissões para tipos de usuários
GRANT EXECUTE ON FUNCTION cascade_delete_store TO authenticated;
GRANT EXECUTE ON FUNCTION cascade_delete_store TO service_role;
