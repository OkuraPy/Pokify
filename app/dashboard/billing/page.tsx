'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimpleBillingPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Página de Assinatura</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Página de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Esta é uma página simples para testar o roteamento.</p>
          <Button>Botão de Teste</Button>
        </CardContent>
      </Card>
    </div>
  );
} 