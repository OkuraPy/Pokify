'use client';

import dynamic from 'next/dynamic';

// Importando dinamicamente os componentes do Recharts para evitar erros de build
export const DynamicLineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
);

export const DynamicLine = dynamic(
  () => import('recharts').then((mod) => mod.Line),
  { ssr: false }
);

export const DynamicXAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
);

export const DynamicYAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
);

export const DynamicCartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);

export const DynamicTooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);

export const DynamicResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

export const DynamicBarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false }
);

export const DynamicBar = dynamic(
  () => import('recharts').then((mod) => mod.Bar),
  { ssr: false }
); 