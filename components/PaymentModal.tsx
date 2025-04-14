'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CardContent, Card } from './ui/card';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  annual_price: number | null;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: Plan;
  userId: string;
  onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, planData, userId, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix'>('credit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
  });
  const [pixData, setPixData] = useState({
    pixCode: '',
    isGenerated: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardData({
      ...cardData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Processar pagamento através da API
      const response = await fetch('/api/user/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planId: planData.id,
          paymentMethod,
          paymentData: paymentMethod === 'credit' ? cardData : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao processar pagamento');
      }

      if (paymentMethod === 'pix') {
        const data = await response.json();
        setPixData({
          pixCode: data.pixCode || 'PIX-CODE-EXEMPLO-12345',
          isGenerated: true,
        });
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handlePixConfirm = () => {
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assinar {planData.name}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 p-3 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        <div>
          <div className="mb-6">
            <h3 className="font-medium mb-2">Detalhes do plano</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="font-medium">{planData.name}</p>
              <p className="text-gray-600 text-sm">{planData.description}</p>
              <p className="mt-2">
                <span className="font-bold text-lg">{formatCurrency(planData.monthly_price)}</span>
                <span className="text-sm text-gray-500">/mês</span>
              </p>
            </div>
          </div>

          <Tabs defaultValue="credit" onValueChange={(value) => setPaymentMethod(value as 'credit' | 'pix')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credit">Cartão de Crédito</TabsTrigger>
              <TabsTrigger value="pix">PIX</TabsTrigger>
            </TabsList>

            <TabsContent value="credit">
              {!loading ? (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="number">Número do Cartão</Label>
                      <Input
                        id="number"
                        name="number"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.number}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Nome no Cartão</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Nome conforme aparece no cartão"
                        value={cardData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Validade</Label>
                        <Input
                          id="expiry"
                          name="expiry"
                          placeholder="MM/AA"
                          value={cardData.expiry}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvc">CVC</Label>
                        <Input
                          id="cvc"
                          name="cvc"
                          placeholder="123"
                          value={cardData.cvc}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Confirmar Pagamento
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  <span className="ml-2">Processando pagamento...</span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pix">
              {!pixData.isGenerated ? (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center mb-4">
                        Clique no botão abaixo para gerar um código PIX para pagamento.
                      </p>
                      <p className="text-sm text-gray-500 text-center">
                        Você será redirecionado para a página de confirmação após o pagamento.
                      </p>
                    </CardContent>
                  </Card>
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando PIX...
                        </>
                      ) : (
                        'Gerar código PIX'
                      )}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center">
                        <div className="border border-gray-200 p-4 rounded-md mb-4 w-full text-center">
                          <p className="font-mono text-sm break-all">{pixData.pixCode}</p>
                        </div>
                        <div className="w-48 h-48 bg-gray-100 mb-4 flex items-center justify-center">
                          <p className="text-gray-500 text-xs">QR Code do PIX</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Escaneie o QR code ou copie o código acima para realizar o pagamento
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button type="button" onClick={handlePixConfirm}>
                      Confirmar Pagamento
                    </Button>
                  </DialogFooter>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 