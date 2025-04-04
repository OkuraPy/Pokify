import { ExtractedProduct, ExtractionResponse } from './openai-extractor';
import { createLogger } from './logger';

const logger = createLogger('AsyncExtractor');

// Armazenamento em memória para job status e resultados
// Em produção, isso seria armazenado em um banco de dados
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface JobResult {
  id: string;
  status: JobStatus;
  startedAt: Date;
  completedAt?: Date;
  result?: ExtractionResponse;
  error?: string;
}

// Armazenamento em memória simples para os jobs
// Isso é apenas para demonstração, em produção usaríamos um banco de dados
// Usando uma abordagem mais robusta com um objeto global para garantir que os dados persistam entre requisições
// @ts-ignore - Variável global
if (!global.__jobsStore) {
  // @ts-ignore - Variável global
  global.__jobsStore = {};
}
// @ts-ignore - Variável global
const jobsStore: Record<string, JobResult> = global.__jobsStore;

/**
 * Classe para gerenciar extrações assíncronas
 */
export class AsyncExtractor {
  
  /**
   * Cria um novo job de extração e retorna o ID do job
   */
  static createJob(params: {
    url: string;
    markdown: string;
    screenshot?: string;
    mode?: string;
    extractFn: (url: string, markdown: string, screenshot?: string, mode?: string) => Promise<ExtractionResponse>;
  }): string {
    const { url, markdown, screenshot, mode, extractFn } = params;
    
    // Criar ID único para o job (timestamp atual)
    const jobId = Date.now().toString();
    
    logger.info(`Criando job de extração ${jobId}`, { url, mode });
    
    // Armazenar o status inicial do job - PRIMEIRO registramos o job para poder consultá-lo
    jobsStore[jobId] = {
      id: jobId,
      status: 'pending',
      startedAt: new Date(),
    };
    
    logger.info(`Job ${jobId} criado e registrado`);
    
    // Iniciar o processamento em background imediatamente, mas garantindo que o objeto job já foi criado
    // Usar Promise.resolve().then() é melhor que setTimeout(0) para garantir execução assíncrona
    Promise.resolve().then(async () => {
      try {
        // Primeiro verificamos se o job ainda existe (pode ter sido cancelado)
        if (!jobsStore[jobId]) {
          logger.warn(`Job ${jobId} foi cancelado antes de iniciar o processamento`);
          return;
        }
        
        // Atualizar o status para 'processing'
        jobsStore[jobId].status = 'processing';
        
        logger.info(`Iniciando processamento do job ${jobId}`, { url, mode });
        
        // Executar a extração
        const result = await extractFn(url, markdown, screenshot, mode);
        
        // Verificar novamente se o job existe antes de atualizar o resultado
        if (!jobsStore[jobId]) {
          logger.warn(`Job ${jobId} foi cancelado durante o processamento`);
          return;
        }
        
        // Armazenar o resultado
        jobsStore[jobId] = {
          ...jobsStore[jobId],
          status: 'completed',
          completedAt: new Date(),
          result: result
        };
        
        logger.info(`Job ${jobId} concluído com sucesso`);
      } catch (error: any) {
        // Verificar se o job ainda existe antes de atualizar o erro
        if (!jobsStore[jobId]) {
          logger.warn(`Job ${jobId} foi cancelado durante o processamento, mas ocorreu um erro: ${error.message}`);
          return;
        }
        
        // Armazenar o erro
        jobsStore[jobId] = {
          ...jobsStore[jobId],
          status: 'failed',
          completedAt: new Date(),
          error: error.message || 'Erro desconhecido'
        };
        
        logger.error(`Erro no job ${jobId}: ${error.message}`);
      }
    });
    
    return jobId;
  }
  
  /**
   * Obtu00e9m o status e resultado de um job
   */
  static getJobStatus(jobId: string): JobResult | null {
    return jobsStore[jobId] || null;
  }
  
  /**
   * Remove um job antigo do armazenamento
   */
  static cleanupJob(jobId: string): boolean {
    if (jobsStore[jobId]) {
      delete jobsStore[jobId];
      return true;
    }
    return false;
  }
}
