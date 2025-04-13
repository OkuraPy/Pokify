import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useSubscriptionStatus = (userId: string | undefined) => {
  const [status, setStatus] = useState<'active' | 'pending' | 'cancelled' | 'free' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('billing_status')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setStatus(data?.billing_status as 'active' | 'pending' | 'cancelled' | 'free' || 'free');
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [userId]);

  return {
    status,
    isLoading,
    isPending: status === 'pending',
    isActive: status === 'active',
    isSubscriber: ['active', 'pending'].includes(status || ''),
  };
}; 