import { StoreClient } from './store-client';

// Mock data - Depois será substituído pela API
const demoStores = [
  { id: '1', name: 'Fashion Store', platform: 'Shopify' },
  { id: '2', name: 'Electronics Hub', platform: 'WooCommerce' },
  { id: '3', name: 'Home Decor', platform: 'Shopify' },
  { id: '4', name: 'Sports Gear', platform: 'WooCommerce' },
];

export async function generateStaticParams() {
  // No futuro, isso virá da API
  return demoStores.map((store) => ({
    storeId: store.id,
  }));
}

export default function StorePage({ params }: { params: { storeId: string } }) {
  // Mock data - Depois será substituído pela API
  const store = {
    id: params.storeId,
    name: demoStores.find(s => s.id === params.storeId)?.name || 'Loja',
    platform: demoStores.find(s => s.id === params.storeId)?.platform || 'Shopify',
    url: 'https://fashion-store.com',
    stats: {
      totalProducts: 156,
      totalReviews: 423,
      conversionRate: 3.2,
      lastSync: new Date().toISOString(),
    },
  };

  return <StoreClient store={store} />;
}
