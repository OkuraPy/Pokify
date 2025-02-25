"use client"

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { OverviewStats } from './overview-stats';
import { PerformanceCharts } from './performance-charts';
import { RecentActivities } from './recent-activities';

export function DashboardContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const router = useRouter();

  // Mock data - Depois será substituído pela API
  const stores = [
    { 
      id: '1', 
      name: 'Fashion Store', 
      productsCount: 156,
      platform: 'Shopify',
      url: 'https://fashion-store.com',
      stats: {
        totalProducts: 156,
        totalReviews: 423,
        conversionRate: 3.2,
        lastSync: new Date().toISOString(),
      },
    },
    { 
      id: '2', 
      name: 'Electronics Hub', 
      productsCount: 89,
      platform: 'WooCommerce',
      url: 'https://electronics-hub.com',
      stats: {
        totalProducts: 89,
        totalReviews: 245,
        conversionRate: 2.8,
        lastSync: new Date().toISOString(),
      },
    },
    { 
      id: '3', 
      name: 'Home Decor', 
      productsCount: 234,
      platform: 'Shopify',
      url: 'https://home-decor.com',
      stats: {
        totalProducts: 234,
        totalReviews: 567,
        conversionRate: 4.1,
        lastSync: new Date().toISOString(),
      },
    },
    { 
      id: '4', 
      name: 'Sports Gear', 
      productsCount: 45,
      platform: 'WooCommerce',
      url: 'https://sports-gear.com',
      stats: {
        totalProducts: 45,
        totalReviews: 123,
        conversionRate: 2.5,
        lastSync: new Date().toISOString(),
      },
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Gerencie suas lojas e acompanhe o desempenho
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/stores')}
          className="h-9 px-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Loja
        </Button>
      </div>

      {/* Overview Stats */}
      <OverviewStats />

      {/* Performance Charts */}
      <PerformanceCharts />

      {/* Stores Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Suas Lojas</h3>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/stores')}
            className="h-8 border-border/60"
          >
            Ver todas
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stores.map((store) => (
            <motion.div
              key={store.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push(`/dashboard/stores/${store.id}`)}
              className="cursor-pointer"
            >
              <div className="rounded-lg border border-border/40 hover:border-border/60 bg-card text-card-foreground p-6 transition-all">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <h3 className="font-medium text-lg">{store.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{store.platform}</span>
                      <span>•</span>
                      <span>{store.productsCount} produtos</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/20"
                      style={{ 
                        width: `${(store.stats.conversionRate / 5) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Atividades Recentes</h3>
        <RecentActivities />
      </div>
    </div>
  );
}
