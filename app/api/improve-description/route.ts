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
      // Modo Pro Copy - usar o prompt mais avançado e melhorado para formatação HTML elegante
      systemPrompt = `Você é um copywriter profissional e designer de conteúdo para e-commerce especializado em criar descrições de produtos de alta conversão com HTML elegante.

Como especialista em copywriting e design de conteúdo, sua tarefa é criar uma copy profissional com formatação HTML perfeita.

DIRETRIZES DE FORMATAÇÃO HTML:
- Use tags HTML semânticas e limpas (<h2>, <h3>, <p>, <ul>, <li>)
- Aplique <strong> apenas em elementos-chave (benefícios, características cruciais, números)
- Nunca em frases inteiras ou parágrafos
- Crie espaçamento adequado sem excessos entre elementos
- Adicione classes para elementos importantes:
  * <h2 class="product-title">
  * <h3 class="benefit-heading">
  * <ul class="features-list">
  * <div class="cta-container">
- Mantenha um layout clean com hierarquia visual clara
- Sem repetições de tags ou espaçamentos desnecessários
- IMPORTANTE: NÃO inclua marcações de código como \`\`\`html ou \`\`\` no início ou fim do conteúdo

ESTRUTURA AIDA PERFEITA:
- ATENÇÃO: Título impactante em <h2> e gancho poderoso
- INTERESSE: Benefícios em seções com <h3> e ícones descritivos (usando HTML semântico)
- DESEJO: Características em listas organizadas e provas sociais
- AÇÃO: Chamada clara com senso de urgência

AVANCADO: Adicione micro-elementos de persuasão:
- Pequenos destaques para números
- Frases curtas de impacto
- Estrutura de parágrafos variados (curto → médio → curto)
- Destaques para garantias e benefícios principais`;
  
      userPrompt = `Reescreva completamente a descrição deste produto criando uma copy profissional com HTML perfeito.

Título do produto: ${title}

Descrição atual: 
${description}

INSTRUÇÕES PARA FORMATAÇÃO HTML PERFEITA:

1. ESTRUTURA GERAL:
   - Evite espaçamentos excessivos (no máximo uma linha entre elementos)
   - Mantenha consistência no estilo e indentação
   - Use no máximo 3 níveis hierárquicos (h2 → h3 → p/lists)
   - NÃO inclua \`\`\`html ou \`\`\` no início ou fim do conteúdo

2. NEGRITO (<strong>):
   - Use apenas para destacar palavras-chave estratégicas
   - Nunca coloque parágrafos inteiros em negrito
   - Destaque números, benefícios chave e características diferenciais
   - Exemplo: "Experimente <strong>30 dias</strong> de satisfação garantida"

3. LISTAS & ESPAÇAMENTO:
   - Use <ul class="features-list"> para características
   - Crie pequenos blocos de conteúdo com margens adequadas
   - Use <div class="benefit-block"> para agrupar benefícios relacionados
   - Mantenha consistência entre espaçamentos de elementos similares

4. CALL-TO-ACTION:
   - Coloque em <div class="cta-section"> com destaque especial
   - Uso estratégico de <strong> apenas nas partes de ação
   - Adicione senso de urgência com formatação apropriada

CRIE a descrição seguindo esta estrutura AIDA impecável:

   A) ATENÇÃO:
      - Título chamativo único em <h2 class="main-title">
      - Subtítulo em <p class="subtitle"> que complementa o título
      - Problema que o cliente enfrenta apresentado claramente

   B) INTERESSE:
      - 3-5 benefícios em seções com títulos <h3 class="benefit-title">
      - Cada benefício com explicação persuasiva (max 2 parágrafos)
      - Destaque de números e resultados com <strong>

   C) DESEJO:
      - Lista organizada de características técnicas
      - Seção de "Por que escolher" com diferenciais
      - Prova social ou testemunho embutido (se aplicável)

   D) AÇÃO:
      - Chamada direta e irresistível
      - Eliminação de objeções finais
      - Garantia ou política de devolução como segurança

Crie uma copy que seja extensa (800+ palavras), perfeita em HTML, extremamente persuasiva, e esteticamente elegante na formatação.`;
    } else {
      // Modo padrão - usar o prompt aprimorado para formatação HTML mais elegante
      systemPrompt = `Você é um copywriter especializado em produtos físicos e formatação HTML elegante.

IMPORTANTE: NÃO inclua marcações de código como \`\`\`html ou \`\`\` no início ou fim do conteúdo.`;

      userPrompt = `Você é um copywriter especializado em produtos físicos e quero criar uma copy de alta conversão com HTML bem formatado para um ${title}.

Aqui está a descrição atual do produto: ${description}

Gere uma copy validada utilizando a estrutura AIDA (Atenção, Interesse, Desejo, Ação), com formatação HTML elegante:

1. FORMATAÇÃO HTML:
   - Use <h2> e <h3> para títulos e subtítulos
   - Parágrafos em <p> com espaçamento adequado (sem excesso)
   - Listas em <ul><li> para características
   - Use <strong> apenas para destacar palavras-chave importantes, nunca parágrafos inteiros
   - Mantenha consistência visual com espaçamento adequado
   - NÃO inclua \`\`\`html ou \`\`\` no início ou fim do conteúdo

2. CONTEÚDO PERSUASIVO:
   - Um gancho forte na introdução para capturar a atenção
   - Uma promessa persuasiva clara e impactante
   - Benefícios destacados de forma emocional e lógica
   - Provas sociais ou diferenciais que gerem desejo
   - Uma chamada para ação direta e irresistível

A copy deve ter formatação HTML limpa, usar negrito apenas nas palavras estratégicas, e estrutura visualmente agradável sem espaçamentos excessivos.`;
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

      let improvedDescription = completion.choices[0]?.message?.content || '';

      if (!improvedDescription) {
        console.error('OpenAI não retornou conteúdo válido');
        return NextResponse.json(
          { error: 'Falha ao gerar descrição melhorada' },
          { status: 500 }
        );
      }
      
      // Pós-processamento do HTML para garantir formatação perfeita
      improvedDescription = processHtml(improvedDescription);
      
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
 * Processa o HTML para garantir formatação excelente
 */
function processHtml(html: string): string {
  let processed = html;
  
  // Remover marcações Markdown de blocos de código
  processed = processed.replace(/```html/g, '');
  processed = processed.replace(/```(\w+)?/g, '');
  processed = processed.replace(/```[\s\S]+?```/g, '');
  
  // Remover especificamente marcações no início do texto
  processed = processed.replace(/^```html\s*/, '');
  processed = processed.replace(/^```(\w+)?\s*/, '');
  processed = processed.replace(/\s*```\s*$/, '');
  
  // Remover caracteres de citação ou backticks soltos
  processed = processed.replace(/^['"`]{3,}/, '');
  processed = processed.replace(/['"`]{3,}$/, '');
  
  // Remover espaços em branco excessivos entre tags
  processed = processed.replace(/>\s{2,}</g, '>\n<');
  
  // Remover múltiplas quebras de linha
  processed = processed.replace(/(\r\n|\n){3,}/g, '\n\n');
  
  // Adicionar classes para elementos principais se não existirem
  if (!processed.includes('class="main-title"') && !processed.includes('class="product-title"')) {
    processed = processed.replace(/<h2>/i, '<h2 class="product-title">');
  }
  
  // Adicionar classes para listas se não existirem
  if (!processed.includes('class="features-list"')) {
    processed = processed.replace(/<ul>/i, '<ul class="features-list">');
  }
  
  // Adicionar classes para chamaodas para ação se identificadas
  const ctaMatch = processed.match(/<p>([^<]*?\b(compre|adquira|garanta|obtenha|comprar)\b[^<]*?)<\/p>/i);
  if (ctaMatch && !processed.includes('class="cta"')) {
    processed = processed.replace(
      ctaMatch[0], 
      `<p class="cta">${ctaMatch[1]}</p>`
    );
  }
  
  // Adicionar uma div de container para CTA no final se tiver "compre", "adquira", etc
  if (!processed.includes('class="cta-container"') && 
      /\b(compre|adquira|garanta|obtenha|comprar)\b/i.test(processed.slice(-200))) {
    
    // Encontrar o último parágrafo que tenha CTA
    const paragraphs = processed.split('</p>');
    let lastIndex = paragraphs.length - 1;
    
    while (lastIndex >= 0) {
      if (/\b(compre|adquira|garanta|obtenha|comprar)\b/i.test(paragraphs[lastIndex])) {
        break;
      }
      lastIndex--;
    }
    
    if (lastIndex >= 0) {
      const beforeCta = paragraphs.slice(0, lastIndex).join('</p>') + '</p>';
      const ctaParagraph = paragraphs[lastIndex] + '</p>';
      const afterCta = paragraphs.slice(lastIndex + 1).join('</p>');
      
      processed = `${beforeCta}<div class="cta-container">${ctaParagraph}</div>${afterCta}`;
    }
  }
  
  // Corrigir tags mal formadas
  processed = processed.replace(/<\/strong<\/p>/g, '</strong></p>');
  processed = processed.replace(/<p><strong>(.*?)<\/p>/g, '<p><strong>$1</strong></p>');
  
  // Evitar negrito em parágrafos completos
  processed = processed.replace(/<p><strong>([^<]{60,})<\/strong><\/p>/g, '<p>$1</p>');
  
  // Adicionar estilos customizados para melhorar a apresentação
  const customStyles = `
<style>
  .product-title {
    font-size: 1.75rem;
    color: #333;
    margin-bottom: 1rem;
    line-height: 1.2;
  }
  h3 {
    font-size: 1.25rem;
    color: #444;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }
  .features-list {
    padding-left: 1.25rem;
    margin: 1rem 0;
  }
  .features-list li {
    margin-bottom: 0.5rem;
    position: relative;
  }
  .cta-container {
    background-color: #f8f9fa;
    border-left: 4px solid #4a90e2;
    padding: 1rem;
    margin: 1.5rem 0;
    border-radius: 4px;
  }
  .cta {
    font-size: 1.1rem;
    font-weight: bold;
    color: #333;
  }
  strong {
    color: #222;
  }
</style>
`;
  
  // Adicionar os estilos ao início, mas após qualquer tag doctype ou html existente
  if (!processed.includes('<style>')) {
    // Se já começar com uma tag html ou doctype, inserir após
    if (processed.match(/^<!DOCTYPE|^<html/i)) {
      const match = processed.match(/^(<!DOCTYPE[^>]*>|<html[^>]*>)/i);
      if (match) {
        const openingTag = match[0];
        processed = processed.replace(openingTag, openingTag + customStyles);
      }
    } else {
      processed = customStyles + processed;
    }
  }
  
  return processed;
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
  
  // Verificar se contém classes CSS
  const hasCustomClasses = /class=["'][^"']+["']/i.test(description);
  
  // Verificar se usa negrito de forma adequada
  const boldUsage = description.match(/<strong>[^<]+<\/strong>/g);
  const appropriateBold = boldUsage ? 
    boldUsage.every(bold => bold.length < 80) && 
    boldUsage.length < description.length / 100 : 
    false;
  
  return {
    wordCount,
    hasHtmlTags,
    hasLists,
    hasHeadings,
    hasEmphasis,
    hasCTA,
    hasCustomClasses,
    appropriateBold,
    quality: wordCount > 800 ? 'excelente' : wordCount > 400 ? 'boa' : 'básica',
    formattingQuality: (hasHtmlTags && hasHeadings && hasCustomClasses && appropriateBold) ? 'excelente' : 'básica'
  };
} 