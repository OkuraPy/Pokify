/**
 * Script de injeção de reviews para lojas Shopify
 * Este script é injetado em todas as páginas da loja e:
 * 1. Detecta se está em uma página de produto
 * 2. Obtém o ID do produto atual
 * 3. Localiza o elemento de descrição do produto
 * 4. Insere o iframe de reviews após a descrição
 */

(function() {
  // Configuração - será substituída dinamicamente pelo backend
  const CONFIG = {
    apiUrl: '{{API_URL}}',
    shopDomain: '{{SHOP_DOMAIN}}',
    userId: '{{USER_ID}}',
    position: '{{POSITION}}',
    customSelector: '{{CUSTOM_SELECTOR}}'
  };

  // Detecta quando o DOM está completamente carregado
  function domReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  // Função para obter o ID do produto atual da URL ou do objeto meta do Shopify
  function getCurrentProductId() {
    // Tenta obter do objeto meta do Shopify primeiro (mais confiável)
    if (window.meta && window.meta.product && window.meta.product.id) {
      return window.meta.product.id;
    }
    
    // Alternativa: tenta extrair da URL
    const urlPath = window.location.pathname;
    if (urlPath.includes('/products/')) {
      const matches = urlPath.match(/\/products\/([^\/\?#]+)/);
      if (matches && matches[1]) {
        return matches[1]; // Retorna o handle do produto
      }
    }
    
    return null;
  }

  // Função para encontrar o elemento de descrição do produto
  function findDescriptionElement() {
    // Lista de seletores comuns para descrição de produto em temas Shopify
    const commonSelectors = [
      '.product__description',
      '.product-description',
      '#product-description',
      '.product-single__description',
      '.product-description-container',
      '[data-product-description]',
      '.product-details__description',
      '.product-details-wrapper .description'
    ];
    
    // Se houver um seletor personalizado configurado, tenta usar primeiro
    if (CONFIG.customSelector && CONFIG.customSelector.trim() !== '') {
      const customElement = document.querySelector(CONFIG.customSelector);
      if (customElement) return customElement;
    }
    
    // Baseado na posição configurada, escolhe os seletores apropriados
    if (CONFIG.position === 'apos_descricao') {
      // Tenta cada seletor comum
      for (const selector of commonSelectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
    } else if (CONFIG.position === 'antes_comprar') {
      // Seletores para áreas próximas ao botão de compra
      const buyButtonSelectors = [
        'form[action*="/cart/add"]',
        '.product-form',
        '.product__form',
        '.product-single__form'
      ];
      
      for (const selector of buyButtonSelectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
    } else if (CONFIG.position === 'final_pagina') {
      // Retorna o container principal do produto para inserir ao final
      const mainContainers = [
        '.product-template',
        '.product-single',
        '.product',
        '#ProductSection',
        '[data-section-type="product-template"]'
      ];
      
      for (const selector of mainContainers) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
    }
    
    // Fallback: retorna o corpo da página como último recurso
    return document.querySelector('.product') || document.body;
  }

  // Função para criar e inserir o iframe
  function insertReviewsIframe(productId, targetElement) {
    if (!targetElement) return;
    
    // Cria um container para o iframe
    const container = document.createElement('div');
    container.className = 'pokify-reviews-container';
    container.style.width = '100%';
    container.style.margin = '30px 0';
    container.style.clear = 'both';
    
    // Cria o iframe
    const iframe = document.createElement('iframe');
    iframe.src = `${CONFIG.apiUrl}/api/reviews/${productId}/iframe?shopDomain=${encodeURIComponent(CONFIG.shopDomain)}&userId=${encodeURIComponent(CONFIG.userId)}`;
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.height = '1000px';
    iframe.style.overflow = 'hidden';
    iframe.title = 'Avaliações do Produto';
    iframe.scrolling = 'no';
    iframe.frameBorder = '0';
    
    // Adiciona o iframe ao container
    container.appendChild(iframe);
    
    // Determina onde inserir baseado na posição configurada
    if (CONFIG.position === 'final_pagina') {
      targetElement.appendChild(container);
    } else {
      targetElement.insertAdjacentElement('afterend', container);
    }
    
    // Ajusta a altura do iframe baseado no conteúdo (usando mensagens)
    window.addEventListener('message', function(event) {
      // Verifica se a mensagem vem do nosso iframe
      if (event.data && event.data.type === 'pokify-reviews-height') {
        iframe.style.height = `${event.data.height}px`;
      }
    });
    
    console.log('Pokify Reviews: iframe inserido após', CONFIG.position);
  }

  // Função principal que inicializa o script
  function init() {
    // Verifica se estamos em uma página de produto
    const productId = getCurrentProductId();
    
    if (!productId) {
      console.log('Pokify Reviews: Não estamos em uma página de produto');
      return;
    }
    
    console.log('Pokify Reviews: Página de produto detectada, ID:', productId);
    
    // Encontra o elemento de descrição
    const descriptionElement = findDescriptionElement();
    
    if (!descriptionElement) {
      console.log('Pokify Reviews: Não foi possível encontrar o elemento de descrição');
      return;
    }
    
    // Insere o iframe após a descrição
    insertReviewsIframe(productId, descriptionElement);
  }

  // Inicializa quando o DOM estiver pronto
  domReady(init);
})(); 