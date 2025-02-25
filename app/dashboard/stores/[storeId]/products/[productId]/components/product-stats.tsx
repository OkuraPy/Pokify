'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface ProductStatsProps {
  product: {
    sales: number;
    views: number;
    averageTicket: number;
  };
}

const data = [
  {
    name: 'Jan',
    total: Math.floor(Math.random() * 5000),
  },
  {
    name: 'Fev',
    total: Math.floor(Math.random() * 5000),
  },
  {
    name: 'Mar',
    total: Math.floor(Math.random() * 5000),
  },
  {
    name: 'Abr',
    total: Math.floor(Math.random() * 5000),
  },
  {
    name: 'Mai',
    total: Math.floor(Math.random() * 5000),
  },
  {
    name: 'Jun',
    total: Math.floor(Math.random() * 5000),
  },
];

export function ProductStats({ product }: ProductStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{product.sales}</div>
          <p className="text-xs text-muted-foreground">
            +20.1% em relação ao mês anterior
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{product.views}</div>
          <p className="text-xs text-muted-foreground">
            +180 visualizações esta semana
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPrice(product.averageTicket)}
          </div>
          <p className="text-xs text-muted-foreground">
            +2% em relação ao mês anterior
          </p>
        </CardContent>
      </Card>
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Vendas Mensais</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value}`}
              />
              <Bar
                dataKey="total"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
