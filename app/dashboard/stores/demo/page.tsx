'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreClient } from '@/app/dashboard/stores/[storeId]/store-client';
import { useRouter } from 'next/navigation';
import { ProductGrid } from '@/app/dashboard/stores/[storeId]/product-grid';

export default function DemoStorePage() {
  const router = useRouter();
  
  // Dados mockados de uma loja com mais estatísticas e produtos
  const mockStore = {
    id: 'demo-store-id',
    name: 'Loja Demo Completa',
    platform: 'shopify',
    url: 'https://demo-loja.myshopify.com',
    stats: {
      totalProducts: 24,
      totalReviews: 128,
      conversionRate: 4.2,
      lastSync: '2023-12-25T15:30:00Z'
    }
  };
  
  // Array de produtos de exemplo para a demonstração
  const mockProducts = [
    {
      id: 'prod-1',
      title: 'Smartphone Avançado XYZ',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGhvbmV8ZW58MHx8MHx8fDA%3D',
      price: 1299.99,
      rating: 4.7,
      reviewsCount: 42,
      status: 'active',
      sales: 85,
      stock: 120
    },
    {
      id: 'prod-2',
      title: 'Fones de Ouvido Wireless',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aGVhZHBob25lc3xlbnwwfHwwfHx8MA%3D%3D',
      price: 299.99,
      rating: 4.5,
      reviewsCount: 28,
      status: 'active',
      sales: 102,
      stock: 75
    },
    {
      id: 'prod-3',
      title: 'Smartwatch Premium',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHNtYXJ0d2F0Y2h8ZW58MHx8MHx8fDA%3D',
      price: 399.99,
      rating: 4.3,
      reviewsCount: 19,
      status: 'active',
      sales: 67,
      stock: 55
    },
    {
      id: 'prod-4',
      title: 'Câmera DSLR Profissional',
      image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2FtZXJhfGVufDB8fDB8fHww',
      price: 899.99,
      rating: 4.8,
      reviewsCount: 32,
      status: 'active',
      sales: 42,
      stock: 27
    }
  ];
  
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Loja Demo Completa</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/stores')}>
            Voltar
          </Button>
          <Button>Sincronizar Produtos</Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Esta é uma página de demonstração</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Esta página usa dados simulados para demonstrar como a interface de uma loja funcionaria,
            sem necessidade de fazer requisições ao banco de dados.
          </p>
          <p>
            Você pode navegar pelos produtos de exemplo, ver estatísticas e explorar as funcionalidades
            disponíveis para gerenciar uma loja completa.
          </p>
        </CardContent>
      </Card>
      
      {/* Renderiza o componente StoreClient com os dados mockados */}
      <StoreClient store={mockStore} />
      
      {/* Adiciona grid de produtos de exemplo */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Produtos da Loja</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {mockProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{product.title}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-bold">R$ {product.price.toFixed(2)}</span>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <span className="text-yellow-500">★</span> {product.rating}
                  </div>
                </div>
                <div className="flex justify-between mt-3">
                  <span className="text-xs text-gray-500">{product.reviewsCount} avaliações</span>
                  <span className="text-xs text-gray-500">Estoque: {product.stock}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                  <Button variant="outline" size="sm">Editar</Button>
                  <Button size="sm">Ver Detalhes</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 