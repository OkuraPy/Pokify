import { ShopifyProductData, ShopifyStore } from '@/lib/shopify';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Obter o ID do produto Shopify da URL
    const shopifyProductId = params.id;
    
    if (!shopifyProductId) {
      return NextResponse.json(
        { success: false, error: 'ID do produto Shopify não fornecido' },
        { status: 400 }
      );
    }
    
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

    // Endpoint para a API REST para atualizar o produto
    const endpoint = `https://${shopUrl}/admin/api/${apiVersion}/products/${shopifyProductId}.json`;

    // Preparar os dados do produto para a API REST
    const productPayload: any = {
      product: {
        title: productData.title,
        body_html: productData.descriptionHtml,
        vendor: productData.vendor,
        product_type: productData.productType,
        status: productData.status === 'ACTIVE' ? 'active' : 'draft',
        tags: productData.tags ? productData.tags.join(', ') : '',
      }
    };

    // Se houver imagens, adicione-as ao payload
    if (productData.images && productData.images.length > 0) {
      productPayload.product.images = productData.images.map((url: string) => ({
        src: url,
        alt: productData.title
      }));
    }

    console.log(`Atualizando produto ${shopifyProductId} no Shopify:`, JSON.stringify(productPayload));

    // Requisição para a API REST do Shopify usando PUT para atualizar
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(productPayload),
    });

    // Se a resposta não for ok, retornar erro
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da API do Shopify ao atualizar produto:', errorData);
      return NextResponse.json({
        success: false,
        error: `Erro da API do Shopify: ${JSON.stringify(errorData)}`,
      }, { status: response.status });
    }

    // Processar a resposta bem-sucedida
    const responseData = await response.json();
    console.log('Resposta da API do Shopify após atualização:', JSON.stringify(responseData));

    // Obter os dados do produto atualizado
    const updatedProduct = responseData.product;
    const handle = updatedProduct.handle;
    const productUrl = `https://${shopUrl}/products/${handle}`;

    // Agora vamos atualizar as variantes (preço, inventário)
    if (productData.variants && productData.variants.length > 0 && updatedProduct.variants && updatedProduct.variants.length > 0) {
      // Obter o ID da primeira variante do Shopify
      const variantId = updatedProduct.variants[0].id;
      
      // Preparar dados da variante
      const variantPayload = {
        variant: {
          id: variantId,
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
        }
      };
      
      // Endpoint para atualizar a variante
      const variantEndpoint = `https://${shopUrl}/admin/api/${apiVersion}/variants/${variantId}.json`;
      
      console.log(`Atualizando variante ${variantId} do produto ${shopifyProductId}:`, JSON.stringify(variantPayload));
      
      // Atualizar a variante
      const variantResponse = await fetch(variantEndpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(variantPayload),
      });
      
      if (!variantResponse.ok) {
        console.warn('Aviso: Não foi possível atualizar a variante, mas o produto foi atualizado');
        console.warn('Resposta de erro da variante:', await variantResponse.json());
      } else {
        console.log('Variante atualizada com sucesso:', await variantResponse.json());
      }
    }

    return NextResponse.json({
      success: true,
      shopifyProductId,
      productUrl
    }, { status: 200 });
    
  } catch (error) {
    console.error('Erro ao atualizar produto no Shopify:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
} 