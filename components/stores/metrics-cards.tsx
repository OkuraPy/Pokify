'use client';

import { Building2, Package, ShoppingCart, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MetricsCardsProps {
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export function MetricsCards({
  totalStores,
  totalProducts,
  totalOrders,
  totalRevenue
}: MetricsCardsProps) {
  // Animação para os cards
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <MetricCard
          title="Lojas"
          value={totalStores}
          icon={<Building2 className="h-5 w-5 text-blue-600" />}
          description="Total de lojas conectadas"
          trend={{ value: 0, label: '' }}
          color="blue"
        />
      </motion.div>
      
      <motion.div variants={item}>
        <MetricCard
          title="Produtos"
          value={totalProducts}
          formatter={formatNumber}
          icon={<Package className="h-5 w-5 text-indigo-600" />}
          description="Total de produtos gerenciados"
          trend={{ value: 5.2, label: 'vs mês anterior', positive: true }}
          color="indigo"
        />
      </motion.div>
      
      <motion.div variants={item}>
        <MetricCard
          title="Pedidos"
          value={totalOrders}
          formatter={formatNumber}
          icon={<ShoppingCart className="h-5 w-5 text-emerald-600" />}
          description="Total de pedidos recebidos"
          trend={{ value: 12.7, label: 'vs mês anterior', positive: true }}
          color="emerald"
        />
      </motion.div>
      
      <motion.div variants={item}>
        <MetricCard
          title="Faturamento"
          value={totalRevenue}
          formatter={formatCurrency}
          icon={<Wallet className="h-5 w-5 text-amber-600" />}
          description="Receita total gerada"
          trend={{ value: 3.4, label: 'vs mês anterior', positive: true }}
          color="amber"
        />
      </motion.div>
    </motion.div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  formatter?: (value: number) => string;
  icon: React.ReactNode;
  description: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  color: 'blue' | 'indigo' | 'emerald' | 'amber' | 'red';
}

function MetricCard({
  title,
  value,
  formatter = (val) => String(val),
  icon,
  description,
  trend,
  color
}: MetricCardProps) {
  const getTrendColor = (isPositive: boolean) => {
    return isPositive ? 'text-emerald-600' : 'text-rose-600';
  };
  
  const getTrendIcon = (isPositive: boolean) => {
    return isPositive ? '↑' : '↓';
  };
  
  const getColorClass = () => {
    switch (color) {
      case 'blue':
        return {
          bgLight: 'bg-blue-50',
          border: 'border-blue-100'
        };
      case 'indigo':
        return {
          bgLight: 'bg-indigo-50',
          border: 'border-indigo-100'
        };
      case 'emerald':
        return {
          bgLight: 'bg-emerald-50',
          border: 'border-emerald-100'
        };
      case 'amber':
        return {
          bgLight: 'bg-amber-50',
          border: 'border-amber-100'
        };
      case 'red':
        return {
          bgLight: 'bg-red-50',
          border: 'border-red-100'
        };
      default:
        return {
          bgLight: 'bg-gray-50',
          border: 'border-gray-100'
        };
    }
  };
  
  const colorClasses = getColorClass();

  return (
    <Card className={`border ${colorClasses.border} hover:shadow-md transition-all`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-bold">
                {formatter(value)}
              </h3>
              {trend && trend.value > 0 && (
                <span className={`text-xs ${getTrendColor(!!trend.positive)}`}>
                  {getTrendIcon(!!trend.positive)} {trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-full ${colorClasses.bgLight}`}>
            {icon}
          </div>
        </div>
        
        {trend && trend.label && (
          <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
            {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 