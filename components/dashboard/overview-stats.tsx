"use client"

import { motion } from 'framer-motion';
import { 
  Store, 
  Package, 
  Star, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  change: {
    value: number;
    timeframe: string;
  };
  icon: any;
  trend: 'up' | 'down' | 'neutral';
}

const StatCard = ({ title, value, change, icon: Icon, trend }: StatCardProps) => {
  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground'
  };

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : TrendingUp;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-border/40 hover:border-border/60 transition-all">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${trendColors[trend]}`}>
                <TrendIcon className="w-4 h-4" />
                <span>{Math.abs(change.value)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
            <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/20"
                style={{ 
                  width: `${Math.abs(change.value) * 10}%`
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              vs. último {change.timeframe}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function OverviewStats() {
  const stats = [
    {
      title: "Total de Lojas",
      value: "12",
      change: { value: 8, timeframe: "mês" },
      icon: Store,
      trend: "up" as const
    },
    {
      title: "Total de Produtos",
      value: "524",
      change: { value: 12, timeframe: "mês" },
      icon: Package,
      trend: "up" as const
    },
    {
      title: "Total de Reviews",
      value: "2.1k",
      change: { value: 5, timeframe: "mês" },
      icon: Star,
      trend: "up" as const
    },
    {
      title: "Taxa de Conversão",
      value: "3.2%",
      change: { value: -1, timeframe: "mês" },
      icon: TrendingUp,
      trend: "down" as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
