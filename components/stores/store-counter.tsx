'use client';

import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Store, 
  AlertTriangle,
  LucideIcon 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface StoreCounterProps {
  storesCount: number;
  maxStores: number;
  variant?: 'default' | 'compact' | 'visual';
  showTooltip?: boolean;
  className?: string;
}

export function StoreCounter({ 
  storesCount, 
  maxStores, 
  variant = 'default',
  showTooltip = true,
  className 
}: StoreCounterProps) {
  const percentage = Math.round((storesCount / maxStores) * 100);
  const remaining = maxStores - storesCount;
  
  // Determinar cores e ícones baseados na utilização
  let progressColor = '';
  let textColor = '';
  let bgColor = '';
  let Icon: LucideIcon;
  let statusText = '';
  
  if (percentage >= 100) {
    progressColor = 'bg-rose-500';
    textColor = 'text-rose-700';
    bgColor = 'bg-rose-50';
    Icon = AlertCircle;
    statusText = 'Limite atingido';
  } else if (percentage >= 75) {
    progressColor = 'bg-amber-500';
    textColor = 'text-amber-700';
    bgColor = 'bg-amber-50';
    Icon = AlertTriangle;
    statusText = 'Quase no limite';
  } else {
    progressColor = 'bg-emerald-500';
    textColor = 'text-emerald-700';
    bgColor = 'bg-emerald-50';
    Icon = CheckCircle2;
    statusText = 'Espaço disponível';
  }
  
  // Componente que mostra a contagem
  const StoreCount = () => (
    <div className={cn("flex items-center gap-1", {
      "justify-between w-full": variant === 'default',
      "justify-center": variant === 'compact',
    })}>
      <div className="flex items-center gap-1.5">
        <Store className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{storesCount}/{maxStores}</span>
      </div>
      
      {variant === 'default' && (
        <div className="text-sm text-muted-foreground">
          {remaining > 0 ? (
            <span>
              {remaining} {remaining === 1 ? 'loja disponível' : 'lojas disponíveis'}
            </span>
          ) : (
            <span className="text-rose-500">Limite atingido</span>
          )}
        </div>
      )}
    </div>
  );
  
  // Componente visual com barras e cores
  const VisualCounter = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={cn("p-1 rounded-full", bgColor)}>
            <Icon className={cn("h-3.5 w-3.5", textColor)} />
          </div>
          <span className={cn("text-sm font-medium", textColor)}>
            {statusText}
          </span>
        </div>
        <span className="text-sm font-medium">
          {storesCount}/{maxStores}
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="relative w-full h-2 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className={cn("absolute inset-y-0 left-0 rounded-full", progressColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {storesCount === 0 ? 'Nenhuma loja criada' : (
              storesCount === 1 ? '1 loja criada' : `${storesCount} lojas criadas`
            )}
          </span>
          <span>
            {remaining > 0 ? (
              remaining === 1 ? '1 disponível' : `${remaining} disponíveis`
            ) : (
              'Nenhuma disponível'
            )}
          </span>
        </div>
      </div>
    </div>
  );
  
  // Miniatura gráfica para uso em interfaces compactas
  const CompactCounter = () => (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full bg-muted/20"></div>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 32 32">
          <circle
            className={progressColor}
            cx="16"
            cy="16"
            r="14"
            fill="none"
            strokeWidth="4"
            strokeDasharray={`${percentage < 100 ? percentage : 100}, 100`}
            strokeLinecap="round"
            transform="rotate(-90 16 16)"
            style={{
              transition: "stroke-dasharray 0.5s ease",
            }}
          />
        </svg>
        <div 
          className="absolute inset-0 flex items-center justify-center text-xs font-medium"
          style={{ color: percentage >= 100 ? '#e11d48' : undefined }}
        >
          {percentage}%
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">Lojas</span>
        <span className="text-xs text-muted-foreground">{storesCount}/{maxStores}</span>
      </div>
    </div>
  );

  const renderCounter = () => {
    switch (variant) {
      case 'visual':
        return <VisualCounter />;
      case 'compact':
        return <CompactCounter />;
      default:
        return <StoreCount />;
    }
  };

  // Renderização condicional com tooltip
  const content = renderCounter();
  
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(className)}>
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent className="space-y-1 p-4 max-w-xs">
            <p className="font-medium mb-1">Limite de Lojas</p>
            <p className="text-sm text-muted-foreground">
              {percentage >= 100 
                ? `Você atingiu o limite de ${maxStores} lojas do seu plano.` 
                : remaining === 1
                  ? `Você ainda pode criar mais 1 loja no seu plano atual.`
                  : `Você ainda pode criar mais ${remaining} lojas no seu plano atual.`
              }
            </p>
            {percentage >= 100 && (
              <p className="text-xs text-rose-500 pt-1">
                Para adicionar mais lojas, faça upgrade do seu plano.
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div className={cn(className)}>
      {content}
    </div>
  );
} 