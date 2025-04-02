import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    console.log('Recebida requisição para melhoria de descrição');
    
    // Verificar se a chave API existe
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key não configurada');
      return NextResponse.json(
        { error: 'Serviço de IA não configurado' },
        { status: 503 }
      );
    }

    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Verificar se o modo pro_copy está ativado na URL ou no corpo
    const modeParam = request.nextUrl.searchParams.get('mode');
    let isProCopyMode = modeParam === 'pro_copy';
    
    // Parse do corpo da requisição
    let body;
    try {
      body = await request.json();
      console.log('Body da requisição:', body);
      
      // Também pode verificar o modo no corpo da requisição
      if (body.mode === 'pro_copy' && !isProCopyMode) {
        console.log('Modo Pro Copy detectado no corpo da requisição');
        isProCopyMode = true;
      }
      
    } catch (e) {
      console.error('Erro ao parsear o corpo da requisição:', e);
      return NextResponse.json(
        { error: 'Corpo da requisição inválido' },
        { status: 400 }
      );
    }
    
    if (isProCopyMode) {
      console.log('🚀 Iniciando geração de copy profissional AIDA avançada');
    } else {
      console.log('🚀 Iniciando melhoria padrão de descrição');
    }
    
    // Extrair os dados relevantes do corpo da requisição
    const { productId, title, description } = body;
    
    if (!productId) {
      console.error('ID do produto não fornecido');
      return NextResponse.json({ 
        error: 'ID do produto é obrigatório' 
      }, { status: 400 });
    }

    if (!title || !description) {
      console.error('Título ou descrição não fornecidos');
      return NextResponse.json({ 
        error: 'Título e descrição são obrigatórios' 
      }, { status: 400 });
    }

    console.log('Processando melhoria para produto:', title);

    // Escolher o prompt baseado no modo
    let systemPrompt, userPrompt;
    
    if (isProCopyMode) {
      // Modo Pro Copy - usar o prompt mais avançado, similar ao da extração
      systemPrompt = `Você é um copywriter profissional de e-commerce especializado em criar descrições de produtos de alta conversão.

Como copywriter especialista, sua tarefa é criar uma copy profissional.

CRIAR UMA COPY PROFISSIONAL
Crie uma descrição de produto detalhada seguindo a estrutura AIDA:
- ATENÇÃO: Gancho poderoso com título em <h2>
- INTERESSE: Solução e benefícios principais
- DESEJO: Detalhes do produto e prova social
- AÇÃO: Chamada à ação clara e persuasiva

A descrição deve:
- Ter formato HTML completo (h2, h3, p, ul, li)
- Ser extensa (800+ palavras) e muito detalhada
- Ter tom profissional e persuasivo
- Terminar com seção de "AÇÃO" clara`;
  
      userPrompt = `Reescreva completamente a descrição deste produto criando uma copy profissional.

Título do produto: ${title}

Descrição atual: 
${description}

CRIE uma descrição completa usando a estrutura AIDA:

   A) ATENÇÃO:
      - Título chamativo em <h2>
      - Gancho poderoso que gere curiosidade
      - Problema que o cliente enfrenta

   B) INTERESSE:
      - Solução oferecida pelo produto
      - 5+ benefícios detalhados
      - Subtítulos em <h3>

   C) DESEJO:
      - Características técnicas completas
      - Listas organizadas <ul><li>
      - Prova social e exclusividade
      - Resposta a possíveis objeções

   D) AÇÃO:
      - Chamada à ação clara "Adquira agora"
      - Urgência e escassez
      - Garantia de satisfação

IMPORTANTE:
- Sua descrição deve ter pelo menos 800 palavras
- Use HTML completo com h2, h3, p, ul, li, strong, em
- Seja MUITO detalhado e persuasivo
- Mantenha qualquer informação técnica importante que estava na descrição original
- Mencione o nome do produto várias vezes para SEO`;
    } else {
      // Modo padrão - usar o prompt original mais simples
      systemPrompt = `Você é um copywriter especializado em produtos físicos.`;

      userPrompt = `Você é um copywriter especializado em produtos físicos e quero criar uma copy de alta conversão para um ${title}.
Aqui está a descrição breve do produto: ${description}

Gere uma copy validada utilizando a estrutura AIDA (Atenção, Interesse, Desejo, Ação), com:

Um gancho forte na introdução para capturar a atenção.
Uma promessa persuasiva clara e impactante.
Benefícios destacados de forma emocional e lógica.
Provas sociais ou diferenciais que gerem desejo.
Uma chamada para ação direta e irresistível com urgência e escassez.
A copy deve ser persuasiva, direta e voltada para conversão, utilizando gatilhos mentais como autoridade, reciprocidade e prova social.

Agora, gere a copy!`;
    }

    console.log('Enviando prompt para OpenAI', isProCopyMode ? '(modo pro_copy)' : '(modo padrão)');
    
    try {
      // Chamar a API da OpenAI com tipagem correta
      const completion = await openai.chat.completions.create({
        model: isProCopyMode ? "gpt-4o" : "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          } as any,
          { 
            role: "user", 
            content: userPrompt 
          } as any
        ],
        temperature: isProCopyMode ? 0.7 : 0.6,
        max_tokens: isProCopyMode ? 4000 : 2000
      });

      const improvedDescription = completion.choices[0]?.message?.content || '';

      if (!improvedDescription) {
        console.error('OpenAI não retornou conteúdo válido');
        return NextResponse.json(
          { error: 'Falha ao gerar descrição melhorada' },
          { status: 500 }
        );
      }
      
      // Verificar a qualidade da descrição gerada
      const descriptionQuality = analyzeDescriptionQuality(improvedDescription);
      console.log('Descrição melhorada gerada com sucesso', descriptionQuality);

      // Atualizar o produto diretamente no banco
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          description: improvedDescription 
        })
        .eq('id', productId);
      
      if (updateError) {
        console.error('Erro ao atualizar descrição do produto:', updateError);
        return NextResponse.json({ 
          error: 'Erro ao salvar descrição melhorada: ' + updateError.message 
        }, { status: 500 });
      }
      
      console.log('Descrição atualizada com sucesso');
      
      // Retorna a descrição melhorada e confirmação de que foi salva
      return NextResponse.json({
        success: true,
        description: improvedDescription,
        descriptionType: isProCopyMode ? 'pro_copy' : 'standard',
        qualityMetrics: descriptionQuality,
        message: isProCopyMode 
          ? 'Copy profissional AIDA gerada com sucesso' 
          : 'Descrição melhorada com sucesso'
      });
    } catch (openaiError) {
      console.error('Erro na chamada OpenAI:', openaiError);
      return NextResponse.json(
        { error: 'Erro no serviço de IA: ' + (openaiError instanceof Error ? openaiError.message : String(openaiError)) },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Erro no processamento da requisição:', error);
    return NextResponse.json(
      { error: 'Erro ao processar melhoria da descrição: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

/**
 * Analisa a qualidade da descrição gerada
 */
function analyzeDescriptionQuality(description: string) {
  // Contar o número de palavras
  const wordCount = description.replace(/<[^>]*>/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
  
  // Verificar se contém tags HTML
  const hasHtmlTags = /<[a-z][^>]*>/i.test(description);
  
  // Verificar se contém listas
  const hasLists = /<ul>|<ol>|<li>/i.test(description);
  
  // Verificar se contém cabeçalhos
  const hasHeadings = /<h[1-6]/i.test(description);
  
  // Verificar se contém elementos de destaque
  const hasEmphasis = /<strong>|<em>|<b>|<i>/i.test(description);
  
  // Verificar se contém chamada para ação
  const hasCTA = /compre|adquira|garanta|peça agora|comprar|adicione ao carrinho/i.test(description);
  
  return {
    wordCount,
    hasHtmlTags,
    hasLists,
    hasHeadings,
    hasEmphasis,
    hasCTA,
    quality: wordCount > 800 ? 'excelente' : wordCount > 400 ? 'boa' : 'básica'
  };
} 