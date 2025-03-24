'use client';

// Cliente-side apenas
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Chart } from '@/components/charts/apex-chart';

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
          <Chart
            type="bar"
            height={350}
            series={[
              {
                name: 'Vendas',
                data: data.map(item => item.total)
              }
            ]}
            options={{
              chart: {
                toolbar: {
                  show: false
                }
              },
              xaxis: {
                categories: data.map(item => item.name),
                labels: {
                  style: {
                    colors: "#888888"
                  }
                },
                tickPlacement: 'on',
                axisBorder: {
                  show: false
                },
                axisTicks: {
                  show: false
                }
              },
              yaxis: {
                labels: {
                  formatter: function(value) {
                    return `R$${value}`;
                  },
                  style: {
                    colors: "#888888"
                  }
                }
              },
              colors: ['#0ea5e9'],
              plotOptions: {
                bar: {
                  borderRadius: 4,
                  columnWidth: '60%',
                }
              },
              grid: {
                borderColor: '#f3f4f6',
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
