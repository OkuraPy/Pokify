import { ShopifyProductData, ShopifyStore } from '@/lib/shopify';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Obter dados da requisição
    const { store, productData } = await request.json();
    
    if (!store || !productData) {
      return NextResponse.json(
        { success: false, error: 'Dados da loja ou do produto não fornecidos' },
        { status: 400 }
      );
    }
    
    // Validar as informações da loja
    if (!store.url) {
      return NextResponse.json(
        { success: false, error: 'URL da loja não fornecido' },
        { status: 400 }
      );
    }
    
    if (!store.api_key) {
      return NextResponse.json(
        { success: false, error: 'Token de acesso do Shopify não fornecido' },
        { status: 400 }
      );
    }
    
    // Configurações para a API do Shopify
    const apiVersion = store.api_version || '2025-01';
    const shopUrl = store.url.replace(/https?:\/\//, '');
    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': store.api_key,
    };

    // Endpoint para a API REST (não GraphQL)
    const endpoint = `https://${shopUrl}/admin/api/${apiVersion}/products.json`;

    // Preparar os dados do produto para a API REST, que aceita tudo em uma única chamada
    const productPayload: any = {
      product: {
        title: productData.title,
        body_html: productData.descriptionHtml,
        vendor: productData.vendor,
        product_type: productData.productType,
        status: productData.status === 'ACTIVE' ? 'active' : 'draft',
        tags: productData.tags ? productData.tags.join(', ') : '',
        variants: [{
          price: typeof productData.variants[0].price === 'string' 
            ? productData.variants[0].price 
            : String(productData.variants[0].price),
          compare_at_price: productData.variants[0].compareAtPrice 
            ? (typeof productData.variants[0].compareAtPrice === 'string'
                ? productData.variants[0].compareAtPrice
                : String(productData.variants[0].compareAtPrice))
            : null,
          sku: productData.variants[0].sku || `IMPORT-${Date.now()}`,
          inventory_quantity: productData.variants[0].inventoryQuantity || 100,
          inventory_management: "shopify"
        }]
      }
    };

    // Se houver imagens, adicione-as ao payload
    if (productData.images && productData.images.length > 0) {
      productPayload.product.images = productData.images.map((url: string) => ({
        src: url,
        alt: productData.title
      }));
    }

    console.log('Enviando produto para o Shopify:', JSON.stringify(productPayload));

    // Requisição para a API REST do Shopify
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(productPayload),
    });

    // Se a resposta não for ok, retornar erro
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da API do Shopify:', errorData);
      return NextResponse.json({
        success: false,
        error: `Erro da API do Shopify: ${JSON.stringify(errorData)}`,
      }, { status: response.status });
    }

    // Processar a resposta bem-sucedida
    const responseData = await response.json();
    console.log('Resposta da API do Shopify:', JSON.stringify(responseData));

    // Obter os dados do produto criado
    const createdProduct = responseData.product;
    const productId = createdProduct.id;
    const handle = createdProduct.handle;
    const productUrl = `https://${shopUrl}/products/${handle}`;

    return NextResponse.json({
      success: true,
      shopifyProductId: productId,
      productUrl
    }, { status: 200 });
    
  } catch (error) {
    console.error('Erro ao publicar produto no Shopify:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
} 