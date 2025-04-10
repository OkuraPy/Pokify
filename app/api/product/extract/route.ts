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

      // Formatar a resposta para manter compatibilidade com o formato esperado pelo frontend
      const response = {
        success: true,
        data: {
          title: productData.title,
          description: productData.description,
          markdownText: productData.description,
          price: productData.price,
          originalPrice: productData.originalPrice,
          discountPercentage: productData.discountPercentage,
          images: [productData.imageUrl],
          metadata: {
            currency: productData.currency
          }
        }
      };

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
