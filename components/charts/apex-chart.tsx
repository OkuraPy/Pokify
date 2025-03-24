'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Importar ApexCharts dinamicamente para evitar problemas de SSR
const ApexCharts = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ApexChartProps {
  type: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'bubble' | 'heatmap' | 'candlestick' | 'boxPlot' | 'radar' | 'polarArea' | 'rangeBar' | 'rangeArea' | 'treemap';
  series: any[];
  options?: any;
  height?: number | string;
  width?: number | string;
}

export function Chart({ type, series, options, height = 350, width = '100%' }: ApexChartProps) {
  const [mounted, setMounted] = useState(false);

  // Renderizar apenas no lado do cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.03)',
          borderRadius: '8px'
        }}
      >
        <div>Carregando gráfico...</div>
      </div>
    );
  }

  // Aplicar tema padrão se não fornecido
  const defaultOptions = {
    chart: {
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      fontFamily: 'inherit',
    },
    grid: {
      borderColor: 'rgba(0,0,0,0.1)',
    },
    tooltip: {
      theme: 'light',
      x: {
        show: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    ...options,
  };

  return (
    <ApexCharts
      type={type}
      height={height}
      width={width}
      series={series}
      options={defaultOptions}
    />
  );
} 