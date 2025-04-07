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

    // Endpoint para a API GraphQL
    const endpoint = `https://${shopUrl}/admin/api/${apiVersion}/graphql.json`;

    // Obter os locais de inventário disponíveis primeiro
    let locationId = "gid://shopify/Location/1"; // Valor padrão caso falhe
    try {
      const locationsQuery = `
        query {
          locations(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      `;
      
      const locationsResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: locationsQuery
        }),
      });
      
      const locationsData = await locationsResponse.json();
      
      if (locationsData.data && 
          locationsData.data.locations && 
          locationsData.data.locations.edges && 
          locationsData.data.locations.edges.length > 0) {
        locationId = locationsData.data.locations.edges[0].node.id;
      }
    } catch (locationError) {
      console.warn('Aviso: Não foi possível obter os locais de inventário:', locationError);
      // Continuamos com o valor padrão
    }

    // Preparar as variáveis para a mutação GraphQL - SEM o campo images
    const variables = {
      input: {
        title: productData.title,
        descriptionHtml: productData.descriptionHtml,
        vendor: productData.vendor,
        productType: productData.productType,
        status: productData.status || 'ACTIVE',
        tags: productData.tags || []
      }
    };

    // Mutação GraphQL para criar produto
    const query = `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            onlineStoreUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Requisição para a API do Shopify
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables
      }),
    });

    const responseData = await response.json();
    
    if (responseData.errors) {
      console.error('Erro na API GraphQL do Shopify:', responseData.errors);
      return NextResponse.json({
        success: false,
        error: `Erro na API do Shopify: ${responseData.errors[0].message}`,
      }, { status: 400 });
    }

    if (responseData.data.productCreate.userErrors.length > 0) {
      const errors = responseData.data.productCreate.userErrors;
      console.error('Erros ao criar produto no Shopify:', errors);
      return NextResponse.json({
        success: false,
        error: `Erro ao criar produto: ${errors.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join(', ')}`,
      }, { status: 400 });
    }

    // Produto criado com sucesso
    const productId = responseData.data.productCreate.product.id;
    const handle = responseData.data.productCreate.product.handle;
    const productUrl = responseData.data.productCreate.product.onlineStoreUrl || 
                     `https://${shopUrl}/products/${handle}`;

    // Adicionar imagens se fornecidas (em uma mutação separada)
    if (productData.images && productData.images.length > 0) {
      try {
        // Usar a mutação productCreateMedia para adicionar imagens
        const createMediaQuery = `
          mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
            productCreateMedia(productId: $productId, media: $media) {
              media {
                mediaContentType
                status
                preview {
                  image {
                    url
                  }
                }
              }
              mediaUserErrors {
                field
                message
              }
            }
          }
        `;

        // Converter URLs de imagens para o formato esperado pelo Shopify
        const mediaInput = productData.images.map((imageUrl: string) => ({
          originalSource: imageUrl,
          mediaContentType: 'IMAGE',
          alt: productData.title
        }));

        const mediaResponse = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: createMediaQuery,
            variables: {
              productId,
              media: mediaInput
            }
          })
        });

        const mediaData = await mediaResponse.json();
        
        if (mediaData.errors || 
            (mediaData.data && 
             mediaData.data.productCreateMedia && 
             mediaData.data.productCreateMedia.mediaUserErrors && 
             mediaData.data.productCreateMedia.mediaUserErrors.length > 0)) {
          
          console.warn('Aviso: Nem todas as imagens foram adicionadas:', 
                      mediaData.errors || mediaData.data.productCreateMedia.mediaUserErrors);
        }
      } catch (mediaError) {
        console.warn('Erro ao adicionar imagens:', mediaError);
        // Continuamos mesmo se houver erro nas imagens, já que o produto foi criado
      }
    }

    // Adicionar variante com preço se informações de variante foram fornecidas
    if (productData.variants && productData.variants.length > 0) {
      try {
        // Consulta para obter as variantes do produto
        const getVariantsQuery = `
          query getProductVariants($id: ID!) {
            product(id: $id) {
              variants(first: 1) {
                edges {
                  node {
                    id
                    inventoryItem {
                      id
                    }
                  }
                }
              }
            }
          }
        `;

        const variantsResponse = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: getVariantsQuery,
            variables: { id: productId }
          }),
        });

        const variantsData = await variantsResponse.json();
        
        if (variantsData.data && variantsData.data.product && 
            variantsData.data.product.variants && 
            variantsData.data.product.variants.edges && 
            variantsData.data.product.variants.edges.length > 0) {
          
          // Obter o ID da primeira variante
          const variantId = variantsData.data.product.variants.edges[0].node.id;
          const inventoryItemId = variantsData.data.product.variants.edges[0].node.inventoryItem?.id;
          
          // Atualizar o preço da variante
          const updateVariantQuery = `
            mutation productVariantUpdate($input: ProductVariantInput!) {
              productVariantUpdate(input: $input) {
                productVariant {
                  id
                  price
                  compareAtPrice
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;
          
          const variantUpdateResponse = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              query: updateVariantQuery,
              variables: {
                input: {
                  id: variantId,
                  price: productData.variants[0].price,
                  compareAtPrice: productData.variants[0].compareAtPrice,
                  sku: productData.variants[0].sku || `IMPORT-${productData.id}-${Date.now()}`
                }
              }
            }),
          });
          
          const variantUpdateData = await variantUpdateResponse.json();
          
          if (variantUpdateData.errors || 
              (variantUpdateData.data && 
               variantUpdateData.data.productVariantUpdate && 
               variantUpdateData.data.productVariantUpdate.userErrors && 
               variantUpdateData.data.productVariantUpdate.userErrors.length > 0)) {
            
            console.warn('Aviso: Não foi possível atualizar o preço da variante:', 
                        variantUpdateData.errors || variantUpdateData.data.productVariantUpdate.userErrors);
          }
          
          // Atualizar o inventário se tiver o ID do item de inventário e se não tivemos sucesso ao configurá-lo inicialmente
          if (inventoryItemId) {
            const inventoryLevel = productData.variants[0].inventoryQuantity || 100;
            
            // Obter os locais de inventário disponíveis (já temos o locationId, mas vamos garantir)
            const inventoryAdjustQuery = `
              mutation inventoryAdjustQuantity($input: InventoryAdjustQuantityInput!) {
                inventoryAdjustQuantity(input: $input) {
                  inventoryLevel {
                    available
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }
            `;
            
            const inventoryResponse = await fetch(endpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                query: inventoryAdjustQuery,
                variables: {
                  input: {
                    inventoryItemId: inventoryItemId,
                    locationId: locationId,
                    availableDelta: inventoryLevel
                  }
                }
              }),
            });
            
            const inventoryData = await inventoryResponse.json();
            
            if (inventoryData.errors || 
                (inventoryData.data && 
                inventoryData.data.inventoryAdjustQuantity && 
                inventoryData.data.inventoryAdjustQuantity.userErrors && 
                inventoryData.data.inventoryAdjustQuantity.userErrors.length > 0)) {
              
              console.warn('Aviso: Não foi possível atualizar o inventário:', 
                          inventoryData.errors || inventoryData.data.inventoryAdjustQuantity.userErrors);
            }
          }
        }
      } catch (variantError) {
        console.warn('Erro ao atualizar variante/inventário:', variantError);
        // Continuamos mesmo se houver erro nas variantes, já que o produto foi criado
      }
    }

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