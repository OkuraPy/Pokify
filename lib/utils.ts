import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Mescla classes CSS condicionalmente usando clsx e tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um valor numérico como moeda (Real brasileiro)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Alias para formatCurrency para compatibilidade
 */
export function formatPrice(value: number): string {
  return formatCurrency(value);
}

/**
 * Formata um número com separadores de milhar
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata uma data no padrão brasileiro
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObject = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObject);
}

/**
 * Formata uma data com horário no padrão brasileiro
 */
export function formatDateTime(date: Date | string): string {
  if (!date) return '';
  
  const dateObject = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObject);
}

/**
 * Formata uma data relativa (há quanto tempo)
 */
export function formatRelativeTime(date: Date | string): string {
  if (!date) return '';
  
  const dateObject = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObject.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `há ${diffInSeconds} segundos`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `há ${diffInMonths} ${diffInMonths === 1 ? 'mês' : 'meses'}`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `há ${diffInYears} ${diffInYears === 1 ? 'ano' : 'anos'}`;
}

/**
 * Trunca uma string para um tamanho máximo e adiciona ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Gera um ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Atrasa a execução por um tempo específico (sleep)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica se um objeto está vazio
 */
export function isEmptyObject(obj: Record<string, any>): boolean {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * Obtém a cor para uma plataforma específica
 */
export function getPlatformColor(platform: string): string {
  const platformLower = platform.toLowerCase();
  
  switch (platformLower) {
    case 'shopify':
      return 'emerald';
    case 'woocommerce':
      return 'purple';
    case 'magento':
      return 'orange';
    case 'mercadolivre':
    case 'mercado livre':
      return 'yellow';
    case 'amazon':
      return 'amber';
    default:
      return 'gray';
  }
}

/**
 * Gera dados aleatórios para demonstração (apenas para fins de desenvolvimento)
 */
export function generateMockData(count: number = 5): any[] {
  const platforms = ['Shopify', 'WooCommerce', 'Magento', 'MercadoLivre', 'Amazon'];
  const result = [];
  
  for (let i = 0; i < count; i++) {
    result.push({
      id: generateId(),
      name: `Loja ${i + 1}`,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      url: `https://loja${i + 1}.com.br`,
      products: Math.floor(Math.random() * 500),
      orders: Math.floor(Math.random() * 1000),
      revenue: Math.floor(Math.random() * 100000),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
    });
  }
  
  return result;
}
