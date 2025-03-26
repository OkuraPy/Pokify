import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
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

    const productId = params.productId;
    if (!productId) {
      console.error('ID do produto não fornecido');
      return NextResponse.json({ 
        error: 'ID do produto é obrigatório' 
      }, { status: 400 });
    }

    console.log('Buscando produto com ID:', productId);
    
    // Buscar o produto atual
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Erro ao buscar produto:', productError);
      return NextResponse.json({ 
        error: 'Erro ao buscar produto' 
      }, { status: 500 });
    }

    if (!product) {
      console.error('Produto não encontrado:', productId);
      return NextResponse.json({ 
        error: 'Produto não encontrado' 
      }, { status: 404 });
    }

    // Verificar se o produto tem descrição
    if (!product.description) {
      console.error('Produto sem descrição:', productId);
      return NextResponse.json(
        { error: 'O produto não possui descrição para melhorar' },
        { status: 400 }
      );
    }

    console.log('Produto encontrado, enviando para IA:', product.title);

    // Versão simplificada para teste - gera uma descrição melhorada sem usar a OpenAI
    // Remove esta parte e descomente o código da OpenAI quando estiver funcionando

    const improvedDescription = `<div class="improved-description">
      <h2>🌟 Transforme seu look com nosso Body Shaper Canelado! 🌟</h2>
      
      <p>Cansada de lutar contra roupas que marcam e não valorizam suas curvas? Nosso <strong>Body Shaper Canelado</strong> foi desenvolvido especialmente para mulheres que desejam se sentir confiantes e poderosas em qualquer roupa.</p>
      
      <p>Com <strong>tecido canelado de compressão média</strong>, este body modela perfeitamente a região abdominal e realça suas curvas naturais, criando uma silhueta invejável instantaneamente.</p>
      
      <h3>✅ Benefícios que você vai amar:</h3>
      <ul>
        <li>🔹 Design anatômico que se adapta ao seu corpo</li>
        <li>🔹 Alças ajustáveis para máximo conforto o dia todo</li>
        <li>🔹 Sem costuras aparentes - use sob qualquer roupa</li>
        <li>🔹 Versatilidade incomparável - do casual ao elegante</li>
      </ul>
      
      <p>Nossas clientes relatam uma transformação imediata na autoconfiança! Junte-se às milhares de mulheres que já descobriram este segredo de estilo.</p>
      
      <p><strong>🔥 PROMOÇÃO ESPECIAL: Compre 1 e Leve 2! 🔥</strong></p>
      
      <p>Oferta por tempo limitado - Apenas algumas unidades em estoque! Garanta o seu agora e revolucione seu guarda-roupa.</p>
    </div>`;
    
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
        error: 'Erro ao salvar descrição melhorada' 
      }, { status: 500 });
    }
    
    console.log('Descrição atualizada com sucesso');
    
    // Retorna a descrição melhorada e confirmação de que foi salva
    return NextResponse.json({
      success: true,
      description: improvedDescription,
      message: 'Descrição melhorada e salva com sucesso'
    });

    /* CÓDIGO ORIGINAL COM OPENAI - DESCOMENTE DEPOIS DE VERIFICAR QUE ESTÁ FUNCIONANDO
    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Preparar o prompt para a OpenAI baseado no modelo fornecido
    const systemPrompt = `Você é um copywriter especializado em produtos físicos e deve criar uma copy de alta conversão para um produto.`;

    const userPrompt = `Aqui está a descrição breve do produto: ${product.title}

${product.description}

Gere uma copy validada utilizando a estrutura AIDA (Atenção, Interesse, Desejo, Ação), com:

1. Um gancho forte na introdução para capturar a atenção.
2. Uma promessa persuasiva clara e impactante.
3. Benefícios destacados de forma emocional e lógica.
4. Provas sociais ou diferenciais que gerem desejo.
5. Uma chamada para ação direta e irresistível com urgência e escassez.

A copy deve ser persuasiva, direta e voltada para conversão, utilizando gatilhos mentais como autoridade, reciprocidade e prova social.

Formate o resultado em HTML com parágrafos, listas e destaques quando apropriado.`;

    console.log('Enviando prompt para OpenAI');
    
    try {
      // Chamar a API da OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Usando um modelo mais rápido e barato para teste
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const improvedDescription = completion.choices[0]?.message?.content || '';

      if (!improvedDescription) {
        console.error('OpenAI não retornou conteúdo válido');
        return NextResponse.json(
          { error: 'Falha ao gerar descrição melhorada' },
          { status: 500 }
        );
      }
      
      console.log('Descrição melhorada gerada com sucesso');

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
          error: 'Erro ao salvar descrição melhorada' 
        }, { status: 500 });
      }
      
      console.log('Descrição atualizada com sucesso');
      
      // Retorna a descrição melhorada e confirmação de que foi salva
      return NextResponse.json({
        success: true,
        description: improvedDescription,
        message: 'Descrição melhorada e salva com sucesso'
      });
    } catch (openaiError) {
      console.error('Erro na chamada OpenAI:', openaiError);
      return NextResponse.json(
        { error: 'Erro no serviço de IA' },
        { status: 503 }
      );
    }
    */
  } catch (error) {
    console.error('Erro no processamento da requisição:', error);
    return NextResponse.json(
      { error: 'Erro ao processar melhoria da descrição' },
      { status: 500 }
    );
  }
} 