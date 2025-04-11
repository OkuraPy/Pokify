'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, AlertTriangle, Calendar, Clock, Loader2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmCancel: () => Promise<void>;
  isProcessing: boolean;
  planName: string;
  nextPaymentDate?: string;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onConfirmCancel,
  isProcessing,
  planName,
  nextPaymentDate
}: CancelSubscriptionDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [remainingDays, setRemainingDays] = useState<number | null>(null);

  // Calcula dias restantes até o próximo pagamento
  useEffect(() => {
    if (nextPaymentDate) {
      const nextDate = new Date(nextPaymentDate);
      const today = new Date();
      const diffTime = nextDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setRemainingDays(diffDays > 0 ? diffDays : 0);
    }
  }, [nextPaymentDate]);

  const handleConfirm = async () => {
    if (confirmText !== 'CANCELAR') {
      setError('Por favor, digite "CANCELAR" em letras maiúsculas para confirmar');
      return;
    }
    
    setError('');
    await onConfirmCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-2xl">
        <div className="flex flex-col h-full">
          {/* Cabeçalho com alerta visual */}
          <div className="bg-gradient-to-r from-red-600 to-rose-700 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-8 w-8" />
              <DialogTitle className="text-2xl font-bold">Cancelar Assinatura</DialogTitle>
            </div>
            <DialogDescription className="text-red-100 text-base">
              Esta ação não pode ser desfeita. Por favor, leia com atenção.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            <Alert variant="destructive" className="border-red-300 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                Você está prestes a cancelar sua assinatura do plano <strong>{planName}</strong>.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-amber-800 font-medium flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Informações importantes:
                </h3>
                <ul className="space-y-2 text-amber-700 text-sm">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Você perderá acesso a todos os recursos premium imediatamente</span>
                  </li>
                  {nextPaymentDate && (
                    <li className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>
                        Sua assinatura estaria agendada para renovação em <strong>{new Date(nextPaymentDate).toLocaleDateString('pt-BR')}</strong>
                        {remainingDays !== null && remainingDays > 0 && (
                          <span className="font-medium"> ({remainingDays} dias restantes)</span>
                        )}
                      </span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Não haverá reembolso pelos dias não utilizados</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Para confirmar o cancelamento, digite <strong>CANCELAR</strong> no campo abaixo:
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Digite CANCELAR"
                  className={`border-2 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {error && (
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 flex gap-3 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
                className="flex-1 sm:flex-initial"
              >
                Voltar
              </Button>
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleConfirm}
                disabled={isProcessing || confirmText !== 'CANCELAR'}
                className="flex-1 sm:flex-initial gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Cancelamento'
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 