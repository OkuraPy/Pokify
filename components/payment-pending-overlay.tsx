import { useRouter } from 'next/navigation';

interface PaymentPendingOverlayProps {
  onClose?: () => void;
}

export const PaymentPendingOverlay = ({ onClose }: PaymentPendingOverlayProps) => {
  const router = useRouter();

  const handleGoToBilling = () => {
    router.push('/dashboard/billing');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">Pagamento Pendente</h2>
        <p className="mb-4">
          Sua assinatura está com pagamento pendente. Para continuar utilizando todos os recursos, 
          por favor regularize seu pagamento.
        </p>
        <div className="flex justify-end space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700"
            >
              Voltar
            </button>
          )}
          <button
            onClick={handleGoToBilling}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Regularizar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}; 