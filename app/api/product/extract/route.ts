import { NextRequest, NextResponse } from 'next/server';
import { ProductExtractorService } from '@/src/services/product-extractor.service';

export async function POST(request: NextRequest) {
  try {
    // Get the URL from the request body
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`[Extract API] Extraindo dados do produto: ${url}`);
    
    try {
      // Usar o nosso serviço de extração dual
      const productData = await ProductExtractorService.extractProductData(url);
      
      console.log(`[Extract API] Dados extraídos com sucesso: ${JSON.stringify({
        title: productData.title,
        price: productData.price,
        originalPrice: productData.originalPrice,
        discountPercentage: productData.discountPercentage,
      })}`);

      // Formatação explícita do preço no formato necessário para o frontend
      let formattedPrice = '';
      if (productData.price) {
        formattedPrice = productData.price.toString().replace(',', '.');
        console.log(`[Extract API] Preço formatado: ${formattedPrice}`);
      }

      let formattedOriginalPrice = '';
      if (productData.originalPrice) {
        formattedOriginalPrice = productData.originalPrice.toString().replace(',', '.');
        console.log(`[Extract API] Preço original formatado: ${formattedOriginalPrice}`);
      }

      // Criar uma versão do markdown que inclui os preços para que sejam detectados pelo regex do formulário
      const markdownWithPrices = `${productData.description}

## Preços
- Preço atual: R$ ${formattedPrice}
- Preço original: R$ ${formattedOriginalPrice}
- Desconto: ${productData.discountPercentage}%
      
${productData.variants && productData.variants.length > 0 ? '## Variantes\n- ' + productData.variants.join('\n- ') : ''}
`;

      console.log(`[Extract API] Markdown com preços embutidos para o regex do formulário:
${markdownWithPrices}`);

      // Formatando para manter a compatibilidade com o formato esperado pelo frontend
      const response = {
        success: true,
        data: {
          title: productData.title,
          description: productData.description,
          markdownText: markdownWithPrices, // ⚠️ Agora usamos o markdown com preços
          price: formattedPrice,    // Formato explícito
          originalPrice: formattedOriginalPrice, // Formato explícito
          // Também adicionando diretamente no objeto raiz para compatibilidade
          compare_at_price: formattedOriginalPrice,
          discountPercentage: productData.discountPercentage,
          images: productData.imageUrl ? [productData.imageUrl] : [],
          metadata: {
            currency: productData.currency
          }
        },
        // Adiciona os campos direto na raiz também para compatibilidade com diferentes estruturas
        title: productData.title,
        price: formattedPrice,
        compare_at_price: formattedOriginalPrice
      };

      console.log(`[Extract API] Resposta final formatada: ${JSON.stringify(response, null, 2)}`);

      return NextResponse.json(response);
    } catch (error) {
      console.error('Erro ao extrair dados usando o serviço dual:', error);
      
      // Se falhar com o serviço dual, tentar o método legado como fallback
      console.log('[Extract API] Tentando método legado como fallback');
      
      // Make the request to the Linkfy API (fallback)
      const response = await fetch('https://api.linkfy.io/api/text/extract-web-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-token': 'FV1CTFNIs7skgnrdZz9JdbVloNTP3WuA'
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error from Linkfy API:', errorText);
        return NextResponse.json(
          { error: `Failed to extract product data: ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      // Log para debug do fallback
      console.log(`[Extract API] Resposta do fallback: ${JSON.stringify(data, null, 2)}`);
      
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error extracting product data:', error);
    return NextResponse.json(
      { error: 'Failed to extract product data' },
      { status: 500 }
    );
  }
}
