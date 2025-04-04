import { NextRequest, NextResponse } from 'next/server';
import { AsyncExtractor } from '@/lib/async-extractor';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API de Status de Extracao');

/**
 * Endpoint para consultar o status de extrações assíncronas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      logger.error('JobId não fornecido na requisição');
      return NextResponse.json({ error: 'JobId é obrigatório' }, { status: 400 });
    }
    
    logger.info(`Consultando status do job ${jobId}`);
    
    // Obter status do job
    const job = AsyncExtractor.getJobStatus(jobId);
    
    if (!job) {
      logger.error(`Job nao encontrado: ${jobId}`);
      return NextResponse.json({ error: 'Job nao encontrado' }, { status: 404 });
    }
    
    // Formatar a resposta
    const response = {
      id: job.id,
      status: job.status,
      startedAt: job.startedAt.toISOString(),
      completedAt: job.completedAt ? job.completedAt.toISOString() : null,
      // Se o job estiver completo e tiver resultado, retornu00e1-lo
      result: job.status === 'completed' ? job.result : null,
      error: job.error || null
    };
    
    logger.info(`Status do job ${jobId}: ${job.status}`);
    
    return NextResponse.json(response);
  } catch (error: any) {
    logger.error(`Erro ao consultar status do job: ${error.message}`);
    return NextResponse.json({ 
      error: 'Erro ao consultar status do job',
      message: error.message 
    }, { status: 500 });
  }
}
