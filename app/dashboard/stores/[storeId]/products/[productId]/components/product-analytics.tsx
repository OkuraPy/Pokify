'use client';

// Cliente-side apenas
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chart } from '@/components/charts/apex-chart';

interface ProductAnalyticsProps {
  productId: string;
}

export function ProductAnalytics({ productId }: ProductAnalyticsProps) {
  // Dados de exemplo - substitua por dados reais do banco de dados
  const data = [
    { name: 'Jan', views: 24, sales: 4 },
    { name: 'Fev', views: 38, sales: 7 },
    { name: 'Mar', views: 52, sales: 10 },
    { name: 'Abr', views: 61, sales: 12 },
    { name: 'Mai', views: 47, sales: 9 },
    { name: 'Jun', views: 55, sales: 11 },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempenho do Produto</CardTitle>
        <CardDescription>
          Visualizações e vendas nos últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Chart
            type="bar"
            height={300}
            series={[
              {
                name: 'Visualizações',
                data: data.map(item => item.views)
              },
              {
                name: 'Vendas',
                data: data.map(item => item.sales)
              }
            ]}
            options={{
              chart: {
                stacked: false,
                toolbar: {
                  show: false
                }
              },
              xaxis: {
                categories: data.map(item => item.name),
                labels: {
                  style: {
                    colors: "#777"
                  }
                }
              },
              colors: ['#8884d8', '#82ca9d'],
              plotOptions: {
                bar: {
                  borderRadius: 5,
                  columnWidth: '60%',
                }
              },
              dataLabels: {
                enabled: false
              },
              grid: {
                borderColor: '#f3f4f6',
              }
            }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">Total de Visualizações</p>
              <p className="text-2xl font-bold">277</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">Total de Vendas</p>
              <p className="text-2xl font-bold">53</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
} 