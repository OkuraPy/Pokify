"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "../hooks/use-user";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CreditCard, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const SubscriptionStatusChecker = () => {
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFixedAlert, setShowFixedAlert] = useState(false);
  const { user } = useUser();
  const supabase = createClientComponentClient();
  const router = useRouter();

  const checkBillingStatus = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('billing_status')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Erro ao verificar status de pagamento:', error);
        return;
      }
      
      setIsPending(data?.billing_status === 'pending');
    } catch (error) {
      console.error('Erro ao verificar status de pagamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkBillingStatus();
      
      // Verificar o status a cada 5 minutos
      const interval = setInterval(() => {
        checkBillingStatus();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Efeito para exibir o modal quando detectar pagamento pendente
  useEffect(() => {
    if (isPending && !isLoading) {
      // Mostrar o modal logo após detectar pagamento pendente
      setShowModal(true);
      
      // Após fechar o modal, mostrar o alerta fixo
      const showAlertTimer = setTimeout(() => {
        setShowFixedAlert(true);
      }, 1000);
      
      return () => clearTimeout(showAlertTimer);
    }
  }, [isPending, isLoading]);

  const handleGoToBilling = () => {
    setShowModal(false);
    router.push('/dashboard/billing?status=pending');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Mostrar o alerta fixo quando o modal for fechado
    setShowFixedAlert(true);
  };

  if (isLoading || !isPending) {
    return null;
  }

  return (
    <>
      {/* Modal de pagamento pendente que aparece imediatamente após o login */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-white p-0 overflow-hidden">
          <div className="bg-red-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-white">Pagamento Pendente</DialogTitle>
              <button onClick={handleCloseModal} className="text-white hover:text-gray-200">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <DialogDescription className="text-gray-100 mt-2">
              Sua conta está com pagamento pendente. É necessário regularizar para continuar utilizando todos os recursos.
            </DialogDescription>
          </div>
          
          <div className="p-6">
            <div className="mb-6 flex items-center justify-center">
              <div className="rounded-full bg-red-100 p-4">
                <CreditCard className="h-10 w-10 text-red-600" />
              </div>
            </div>
            
            <div className="mb-6 text-center">
              <h3 className="text-lg font-medium mb-2">Sua assinatura precisa de atenção</h3>
              <p className="text-gray-600">
                Identificamos que há um pagamento pendente em sua conta. Para continuar utilizando 
                todos os recursos da plataforma, por favor regularize seu pagamento.
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button 
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={handleGoToBilling}
              >
                Regularizar Pagamento Agora
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleCloseModal}
              >
                Lembrar Mais Tarde
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerta fixo que permanece na tela após fechar o modal */}
      {showFixedAlert && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <Alert variant="destructive" className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Pagamento Pendente</AlertTitle>
            <AlertDescription>
              <p className="mb-3">
                Seu pagamento está pendente. Algumas funcionalidades estão limitadas até a confirmação do pagamento.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleGoToBilling}
                className="w-full"
              >
                Verificar Pagamento
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}; 