import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

// Como estamos usando uma abordagem simplificada em vez do Trigger.dev completo,
// este endpoint simula a verificau00e7u00e3o de status de um job

const logger = createLogger('API de Status de Extração');

// Em uma implementau00e7u00e3o real, aru00edamos o status dos jobs em um banco de dados
// Aqui, apenas simulamos o comportamento para compatibilidade
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      logger.error('JobId não fornecido na requisição');
      return NextResponse.json({ error: 'JobId é obrigatório' }, { status: 400 });
    }
    
    logger.info(`Consultando status do job ${jobId}`);
    
    // Simular um job em processamento ou concluído baseado no tempo
    // Em uma implementau00e7u00e3o real, consultaru00edamos o banco de dados aqui
    const now = Date.now();
    const jobTime = parseInt(jobId, 10);
    const elapsedTime = now - jobTime;
    
    // Simular um processamento de 15 segundos
    const isCompleted = elapsedTime > 15000;
    
    const status = {
      id: jobId,
      status: isCompleted ? 'COMPLETED' : 'PROCESSING',
      startedAt: new Date(jobTime).toISOString(),
      completedAt: isCompleted ? new Date(jobTime + 15000).toISOString() : null,
      // Em uma implementau00e7u00e3o real, retornaramos o resultado real do job
      result: isCompleted ? { 
        success: true,
        data: {
          title: 'Resultado simulado da extrau00e7u00e3o',
          description: 'Este é um resultado simulado porque estamos usando uma abordagem simplificada.'
        }
      } : null,
      error: null
    };
    
    logger.info(`Status do job ${jobId}: ${status.status}`);
    
    return NextResponse.json(status);
  } catch (error: any) {
    logger.error(`Erro ao consultar status do job: ${error.message}`);
    return NextResponse.json({ 
      error: 'Erro ao consultar status do job',
      message: error.message 
    }, { status: 500 });
  }
}
