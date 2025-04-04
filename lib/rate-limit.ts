/**
 * Módulo simplificado de rate-limit para proteger as APIs
 */

interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

interface RateLimitResponse {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  error?: string;
}

// Mapa para guardar as tentativas por IP
const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Função simples de rate limit baseada em IP
 * @param ip IP do usuário
 * @param options Opções de configuração
 * @returns Objeto com status do rate limit
 */
const rateLimit = (ip: string, options: RateLimitOptions = {}): RateLimitResponse => {
  const {
    limit = 10,          // Máximo de requisições por janela de tempo
    windowMs = 60 * 1000 // Janela de tempo: 1 minuto
  } = options;
  
  const now = Date.now();
  const resetTime = now + windowMs;
  
  // Inicializar ou obter dados do IP
  const ipData = ipRequestMap.get(ip) || { count: 0, resetTime };
  
  // Se o tempo de reset já passou, zerar contagem
  if (now > ipData.resetTime) {
    ipData.count = 0;
    ipData.resetTime = resetTime;
  }
  
  // Incrementar contador
  ipData.count += 1;
  
  // Salvar atualizações
  ipRequestMap.set(ip, ipData);
  
  // Calcular valores de retorno
  const remaining = Math.max(0, limit - ipData.count);
  const success = ipData.count <= limit;
  
  return {
    success,
    limit,
    remaining,
    reset: new Date(ipData.resetTime),
    ...(success ? {} : { error: 'Limite de requisições excedido' })
  };
};

export default rateLimit;
