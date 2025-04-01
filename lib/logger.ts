/**
 * Utilitário para logs padronizados com diferentes níveis e formatação
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Emojis para cada nível de log
const LOG_LEVEL_EMOJIS = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌'
};

// Cores ANSI para logs no terminal (quando disponível)
const LOG_LEVEL_COLORS = {
  debug: '\x1b[36m', // Ciano
  info: '\x1b[32m',  // Verde
  warn: '\x1b[33m',  // Amarelo
  error: '\x1b[31m', // Vermelho
  reset: '\x1b[0m'   // Reset
};

// Configuração global
const config = {
  useEmojis: true,
  useColors: true,
  minLevel: process.env.LOG_LEVEL as LogLevel || 'info'
};

// Mapa de níveis de log para prioridade numérica
const LOG_LEVEL_PRIORITY = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Verifica se o nível de log atual está habilitado com base na configuração
 */
function isLevelEnabled(level: LogLevel): boolean {
  const minPriority = LOG_LEVEL_PRIORITY[config.minLevel];
  const currentPriority = LOG_LEVEL_PRIORITY[level];
  return currentPriority >= minPriority;
}

/**
 * Cria um logger com um contexto específico
 */
export function createLogger(context: string) {
  return {
    /**
     * Log de nível debug (somente para desenvolvimento)
     */
    debug: (message: string, data?: any) => {
      if (!isLevelEnabled('debug')) return;
      logMessage('debug', context, message, data);
    },
    
    /**
     * Log de nível info (informações gerais)
     */
    info: (message: string, data?: any) => {
      if (!isLevelEnabled('info')) return;
      logMessage('info', context, message, data);
    },
    
    /**
     * Log de nível warn (avisos)
     */
    warn: (message: string, data?: any) => {
      if (!isLevelEnabled('warn')) return;
      logMessage('warn', context, message, data);
    },
    
    /**
     * Log de nível error (erros)
     */
    error: (message: string, data?: any) => {
      if (!isLevelEnabled('error')) return;
      logMessage('error', context, message, data);
    },
    
    /**
     * Log de desempenho para medir tempo de execução
     */
    perf: (label: string, startTime: number) => {
      if (!isLevelEnabled('debug')) return;
      const duration = Date.now() - startTime;
      logMessage('debug', context, `⏱️ ${label}: ${duration}ms`);
      return duration;
    },
    
    /**
     * Cria uma seção de log com início e fim
     */
    section: (name: string) => {
      if (!isLevelEnabled('info')) return { end: () => {} };
      
      const sectionStartTime = Date.now();
      logMessage('info', context, `▶️ Iniciando: ${name}`);
      
      return {
        end: () => {
          const duration = Date.now() - sectionStartTime;
          logMessage('info', context, `⏹️ Finalizado: ${name} (${duration}ms)`);
          return duration;
        }
      };
    }
  };
}

/**
 * Função interna para registrar mensagens de log
 */
function logMessage(level: LogLevel, context: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const emoji = config.useEmojis ? LOG_LEVEL_EMOJIS[level] + ' ' : '';
  const color = config.useColors ? LOG_LEVEL_COLORS[level] : '';
  const resetColor = config.useColors ? LOG_LEVEL_COLORS.reset : '';
  
  const prefix = `[${timestamp}] ${color}[${level.toUpperCase()}]${resetColor} [${context}]`;
  
  if (data !== undefined) {
    // Se temos dados adicionais, formatar como JSON
    let dataStr: string;
    if (typeof data === 'object') {
      try {
        // Limitar strings longas em objetos
        const limitedData = limitStringLengths(data);
        dataStr = JSON.stringify(limitedData, null, 2);
      } catch (e) {
        dataStr = String(data);
      }
    } else {
      dataStr = String(data);
    }
    
    console[level](`${prefix} ${emoji}${message}`, dataStr);
  } else {
    console[level](`${prefix} ${emoji}${message}`);
  }
}

/**
 * Limita o tamanho de strings longas em objetos para melhor legibilidade nos logs
 */
function limitStringLengths(obj: any, maxLength = 500): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => limitStringLengths(item, maxLength));
  }
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.length > maxLength) {
      result[key] = value.substring(0, maxLength) + `... (${value.length - maxLength} caracteres omitidos)`;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = limitStringLengths(value, maxLength);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Exportar uma instância padrão para uso rápido
export const logger = createLogger('App'); 