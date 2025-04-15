'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function PasswordChangeModal() {
  // FUNCIONALIDADE DESABILITADA POR SOLICITAÇÃO
  // Manteremos o componente para compatibilidade, mas o modal não será mais exibido
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  useEffect(() => {
    // Remover a flag de necessidade de troca de senha ao montar o componente
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('needs_password_change');
    }
    
    // Não há mais verificação ou exibição do modal
  }, []);
  
  // Mantemos a função para compatibilidade, mas ela não faz nada
  const handlePasswordChange = async () => {
    // Função desabilitada
  };
  
  // Retornamos o componente vazio (sem modal)
  return null;
}
