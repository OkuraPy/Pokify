'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { ChartFilters } from './chart-filters';
import { DateRange } from 'react-day-picker';

const generateData = (days: number) => {
  const data = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      produtos: Math.floor(Math.random() * 50) + 20,
      reviews: Math.floor(Math.random() * 30) + 10
    });
  }
  
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/60 border border-border/40 rounded-lg shadow-lg p-3">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name === 'produtos' ? 'Produtos' : 'Reviews'}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PerformanceCharts() {
  const [data, setData] = useState(generateData(30));

  const handlePeriodChange = (period: string) => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    setData(generateData(days));
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      const days = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
      setData(generateData(days));
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Data', 'Produtos', 'Reviews'],
      ...data.map(item => [item.name, item.produtos, item.reviews])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'performance_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Dados exportados com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ChartFilters 
          onPeriodChange={handlePeriodChange}
          onDateRangeChange={handleDateRangeChange}
          onExport={handleExport}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden border-border/40 hover:border-border/60 transition-all">
          <CardHeader className="px-6 pt-6 pb-4 border-b">
            <CardTitle className="font-medium">Produtos Adicionados</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorProdutos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs text-muted-foreground" 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs text-muted-foreground" 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="produtos"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProdutos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/40 hover:border-border/60 transition-all">
          <CardHeader className="px-6 pt-6 pb-4 border-b">
            <CardTitle className="font-medium">Reviews Coletados</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs text-muted-foreground" 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs text-muted-foreground" 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reviews"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReviews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
