-- Atualizar as políticas de lojas para validar o status do plano

-- Remover todas as políticas existentes para a tabela stores
DROP POLICY IF EXISTS stores_select_own ON stores;
DROP POLICY IF EXISTS stores_insert_own ON stores;
DROP POLICY IF EXISTS stores_update_own ON stores;
DROP POLICY IF EXISTS stores_delete_own ON stores;

-- Recriar todas as políticas com as restrições adequadas
CREATE POLICY stores_select_own ON stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY stores_insert_own ON stores
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND billing_status != 'free'
    )
  );

CREATE POLICY stores_update_own ON stores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY stores_delete_own ON stores
  FOR DELETE USING (auth.uid() = user_id); 