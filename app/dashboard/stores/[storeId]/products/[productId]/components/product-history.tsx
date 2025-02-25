'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductHistoryProps {
  product: {
    createdAt: string;
    updatedAt: string;
  };
}

const history = [
  {
    id: 1,
    type: 'update',
    field: 'price',
    oldValue: 'R$ 79,90',
    newValue: 'R$ 89,90',
    user: {
      name: 'John Doe',
      avatar: 'https://github.com/shadcn.png',
    },
    date: new Date(2024, 1, 24, 15, 30),
  },
  {
    id: 2,
    type: 'update',
    field: 'stock',
    oldValue: '45',
    newValue: '50',
    user: {
      name: 'Jane Smith',
      avatar: 'https://github.com/shadcn.png',
    },
    date: new Date(2024, 1, 24, 14, 15),
  },
  {
    id: 3,
    type: 'create',
    user: {
      name: 'John Doe',
      avatar: 'https://github.com/shadcn.png',
    },
    date: new Date(2024, 1, 24, 10, 0),
  },
];

export function ProductHistory({ product }: ProductHistoryProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Histórico de Alterações</h4>
        <p className="text-sm text-muted-foreground">
          Últimas alterações feitas no produto
        </p>
      </div>
      <div className="space-y-8">
        {history.map((item) => (
          <div key={item.id} className="flex items-start gap-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src={item.user.avatar} alt={item.user.name} />
              <AvatarFallback>
                {item.user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">{item.user.name}</span>
                {item.type === 'create' ? (
                  <span className="text-muted-foreground"> criou o produto</span>
                ) : (
                  <span className="text-muted-foreground">
                    {' '}
                    alterou o campo{' '}
                    <span className="font-medium">{item.field}</span> de{' '}
                    <span className="font-medium">{item.oldValue}</span> para{' '}
                    <span className="font-medium">{item.newValue}</span>
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(item.date, "d 'de' MMMM 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
