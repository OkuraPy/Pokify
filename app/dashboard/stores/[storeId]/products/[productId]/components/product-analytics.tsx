import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#8884d8" name="Visualizações" />
              <Bar dataKey="sales" fill="#82ca9d" name="Vendas" />
            </BarChart>
          </ResponsiveContainer>
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