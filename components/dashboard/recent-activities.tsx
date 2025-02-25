"use client"

import { motion } from 'framer-motion';
import { 
  Package, 
  Store, 
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Activity {
  id: string;
  type: 'product' | 'store' | 'sync';
  title: string;
  description: string;
  status: 'success' | 'pending' | 'error';
  timestamp: string;
}

const StatusIcon = ({ status }: { status: Activity['status'] }) => {
  const icons = {
    success: CheckCircle2,
    pending: Clock,
    error: XCircle
  };
  const colors = {
    success: 'text-success',
    pending: 'text-warning',
    error: 'text-destructive'
  };
  
  const Icon = icons[status];
  return <Icon className={`w-5 h-5 ${colors[status]}`} />;
};

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
  const icons = {
    product: Package,
    store: Store,
    sync: RefreshCw
  };
  
  const colors = {
    product: 'bg-blue-50 text-blue-500',
    store: 'bg-purple-50 text-purple-500',
    sync: 'bg-green-50 text-green-500'
  };
  
  const Icon = icons[type];
  return (
    <div className={`p-3 rounded-lg ${colors[type]}`}>
      <Icon className="w-6 h-6" />
    </div>
  );
};

// Dados de exemplo
const recentActivities: Activity[] = [
  {
    id: '1',
    type: 'product',
    title: 'Novo Produto Importado',
    description: 'iPhone 15 Pro Max foi importado com sucesso',
    status: 'success',
    timestamp: '2 minutos atrás'
  },
  {
    id: '2',
    type: 'store',
    title: 'Nova Loja Conectada',
    description: 'Integração com Shopify concluída',
    status: 'success',
    timestamp: '1 hora atrás'
  },
  {
    id: '3',
    type: 'sync',
    title: 'Sincronização em Andamento',
    description: 'Atualizando preços e estoque',
    status: 'pending',
    timestamp: 'Agora'
  },
  {
    id: '4',
    type: 'product',
    title: 'Falha na Importação',
    description: 'Erro ao importar produto da AliExpress',
    status: 'error',
    timestamp: '5 minutos atrás'
  }
];

export function RecentActivities() {
  return (
    <Card className="overflow-hidden border-border/40 hover:border-border/60 transition-all">
      <CardHeader className="px-6 pt-6 pb-4 border-b">
        <CardTitle className="font-medium">Atividades Recentes</CardTitle>
        <CardDescription>Últimas ações e atualizações do sistema</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {recentActivities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-4"
            >
              <ActivityIcon type={activity.type} />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-medium truncate">{activity.title}</h4>
                  <StatusIcon status={activity.status} />
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs font-normal bg-secondary/30 hover:bg-secondary/40"
                  >
                    {activity.timestamp}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
