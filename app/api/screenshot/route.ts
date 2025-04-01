import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { Buffer } from 'buffer';

/**
 * Função para logar de forma padronizada
 */
function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [SCREENSHOT API] [${level.toUpperCase()}]`;
  
  if (data) {
    console[level](`${prefix} ${message}`, data);
  } else {
    console[level](`${prefix} ${message}`);
  }
}

export async function POST(request: NextRequest) {
  log('info', '🚀 Iniciando serviço de captura de screenshot');
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      log('error', '❌ URL não fornecida');
      return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 });
    }
    
    log('info', `📸 Capturando screenshot para URL: ${url}`);
    
    // Iniciar o Puppeteer
    log('info', '🤖 Iniciando navegador Puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    try {
      // Criar nova página
      const page = await browser.newPage();
      log('info', '📄 Nova página criada');
      
      // Definir viewport para simular um desktop
      await page.setViewport({
        width: 1366,
        height: 2000, // Altura prolongada para capturar mais conteúdo
        deviceScaleFactor: 1,
      });
      log('info', '🖥️ Viewport configurado: 1366x2000');
      
      // Configurar timeout maior para carregamento de páginas grandes
      page.setDefaultNavigationTimeout(30000);
      
      // Registrar eventos importantes
      page.on('console', msg => {
        log('info', `🌐 Console da página: ${msg.text()}`);
      });
      
      page.on('pageerror', error => {
        log('warn', `⚠️ Erro na página: ${error.message}`);
      });
      
      // Bloquear recursos não essenciais para acelerar carregamento
      await page.setRequestInterception(true);
      
      let requestsTotal = 0;
      let requestsBlocked = 0;
      
      page.on('request', (req) => {
        requestsTotal++;
        const resourceType = req.resourceType();
        if (resourceType === 'media' || resourceType === 'font') {
          requestsBlocked++;
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // Navegar para a URL
      log('info', `🌐 Navegando para a URL: ${url}`);
      const navigationStart = Date.now();
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        log('info', `✅ Navegação concluída em ${Date.now() - navigationStart}ms`);
      } catch (navError: any) {
        log('warn', `⚠️ Problema durante navegação: ${navError.message}`);
        // Continuar mesmo com erro, pode ser apenas timeout
      }
      
      // Esperar carregamento adicional se necessário
      log('info', '⏳ Aguardando 2s para carregamento adicional');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Rolar página para garantir carregamento de imagens e conteúdo
      log('info', '📜 Rolando a página para carregar conteúdo');
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 300;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            
            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0); // Voltar ao topo
              resolve();
            }
          }, 100);
        });
      });
      
      // Aguardar pelo elemento principal que contém o produto (ajustar conforme necessário)
      log('info', '⏳ Aguardando 1s para estabilizar a página');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Coletar algumas métricas da página para debugging
      const metrics = await page.metrics();
      log('info', '📊 Métricas da página:', {
        JSHeapUsed: Math.round((metrics.JSHeapUsedSize || 0) / 1024 / 1024) + 'MB',
        JSHeapTotal: Math.round((metrics.JSHeapTotalSize || 0) / 1024 / 1024) + 'MB',
        Nodes: metrics.Nodes || 0,
        Frames: metrics.Frames || 0
      });
      
      // Coletar dimensões da página
      const dimensions = await page.evaluate(() => {
        return {
          width: document.documentElement.clientWidth,
          height: document.documentElement.scrollHeight,
          devicePixelRatio: window.devicePixelRatio,
        };
      });
      log('info', '📏 Dimensões da página:', dimensions);
      
      // Capturar o screenshot como base64
      log('info', '📸 Capturando screenshot da página');
      const screenshotStart = Date.now();
      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'jpeg',
        quality: 80
      });
      
      // Converter para base64
      const base64Image = Buffer.from(screenshot).toString('base64');
      const screenshotSize = base64Image.length / 1024; // KB
      
      log('info', `✅ Screenshot capturado em ${Date.now() - screenshotStart}ms`, {
        tamanho: `${Math.round(screenshotSize)} KB`,
        formato: 'JPEG (qualidade 80%)',
        requestsTotal,
        requestsBlocked
      });
      
      // Tempo total de processamento
      const totalTime = Date.now() - startTime;
      log('info', `🏁 Processamento concluído em ${totalTime}ms`);
      
      return NextResponse.json({ 
        success: true, 
        screenshot: base64Image,
        meta: {
          url,
          timestamp: new Date().toISOString(),
          size: base64Image.length,
          processingTime: totalTime,
          imageSize: `${Math.round(screenshotSize)} KB`
        }
      });
    } finally {
      // Sempre fechar o navegador para liberar recursos
      await browser.close();
      log('info', '🔒 Navegador fechado');
    }
  } catch (error: any) {
    log('error', `❌ Erro ao capturar screenshot: ${error.message}`, error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 