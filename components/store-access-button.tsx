import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PaymentPendingOverlay } from './payment-pending-overlay';

interface StoreAccessButtonProps {
  storeId: string;
  children: ReactNode;
  className?: string;
}

export function StoreAccessButton({ storeId, children, className = '' }: StoreAccessButtonProps) {
  const [billingStatus, setBillingStatus] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkBillingStatus = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('users')
          .select('billing_status')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Erro ao verificar status:', error);
          return;
        }

        setBillingStatus(data.billing_status);
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkBillingStatus();
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (billingStatus === 'pending') {
      e.preventDefault();
      e.stopPropagation();
      // Em vez de mostrar popup, redirecionar para a página de billing
      router.push('/dashboard/billing');
      return false;
    }
  };

  return (
    <>
      <a 
        href={`/dashboard/stores/${storeId}`} 
        onClick={handleClick}
        className={`${billingStatus === 'pending' ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      >
        {children}
      </a>

      {showPopup && (
        <PaymentPendingOverlay onClose={() => setShowPopup(false)} />
      )}
    </>
  );
} 