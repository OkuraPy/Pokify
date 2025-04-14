'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function PasswordChangeModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  useEffect(() => {
    // Verificar se o usuário precisa trocar a senha
    const checkPasswordChange = () => {
      const needsChange = sessionStorage.getItem('needs_password_change');
      
      if (needsChange === 'true') {
        setOpen(true);
      }
    };
    
    // Verificar imediatamente
    checkPasswordChange();
    
    // Ouvinte para mudanças no storage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'needs_password_change' && e.newValue === 'true') {
        setOpen(true);
      }
    };
    
    // Adicionar listener para mudanças no sessionStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Limpar o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const handlePasswordChange = async () => {
    try {
      if (password !== confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }
      
      if (password.length < 8) {
        toast.error("A senha deve ter pelo menos 8 caracteres");
        return;
      }
      
      setLoading(true);
      
      // Atualizar a senha
      const { error: authError } = await supabase.auth.updateUser({
        password,
      });
      
      if (authError) throw authError;
      
      // Atualizar o status no banco de dados
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error("Usuário não encontrado");
      
      // Atualizar os metadados do usuário para indicar que a senha foi trocada
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { temporary_password: false }
      });
      
      if (metadataError) throw metadataError;
      
      // Tentamos atualizar o timestamp na tabela users
      try {
        await supabase
          .from('users')
          .update({ 
            updated_at: new Date().toISOString() // Atualizar apenas o timestamp
          })
          .eq('id', user.user.id);
      } catch (updateError) {
        // Não interrompe o fluxo se falhar
      }
      
      // Neste ponto, a senha já foi alterada e os metadados atualizados
      
      // Limpar o flag da sessão
      sessionStorage.removeItem('needs_password_change');
      
      toast.success("Sua senha foi atualizada com sucesso");
      
      setOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar sua senha");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Impedir que o usuário feche o modal sem alterar a senha
        if (open && newOpen === false) {
          return; // Não permitir fechar
        }
        setOpen(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <div className="p-2 space-y-4">
          <h2 className="text-xl font-bold">Alterar sua senha temporária</h2>
          <p className="text-sm text-gray-500">
            Por motivos de segurança, você precisa alterar sua senha temporária antes de continuar.
          </p>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              placeholder="Digite sua nova senha"
            />
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirme a nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1"
              placeholder="Digite novamente sua senha"
            />
          </div>
        </div>
        
          <Button 
            onClick={handlePasswordChange} 
            disabled={loading || !password || !confirmPassword}
            className="w-full"
          >
            {loading ? "Processando..." : "Salvar nova senha"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
