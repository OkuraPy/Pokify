import React, { useState } from 'react';
import { Button, Tooltip, notification } from 'antd';
import { ShopOutlined, LoadingOutlined } from '@ant-design/icons';
import { publishProductToShopify } from '../services/shopifyService';

/**
 * Botu00e3o para publicar um produto no Shopify
 * @param {Object} props - Propriedades do componente
 * @param {string} props.productId - ID do produto no Pokify
 * @param {string} props.storeId - ID da loja no Pokify
 */
const ShopifyPublishButton = ({ productId, storeId }) => {
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    try {
      const result = await publishProductToShopify(productId, storeId);
      
      notification.success({
        message: 'Produto publicado com sucesso!',
        description: `O produto foi publicado no Shopify com ID: ${result.shopifyProductId}`,
        placement: 'bottomRight',
      });
    } catch (error) {
      console.error('Erro ao publicar no Shopify:', error);
      
      notification.error({
        message: 'Erro ao publicar no Shopify',
        description: error.message || 'Ocorreu um erro ao tentar publicar o produto no Shopify',
        placement: 'bottomRight',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="Publicar produto no Shopify">
      <Button 
        type="primary" 
        icon={loading ? <LoadingOutlined /> : <ShopOutlined />}
        onClick={handlePublish}
        loading={loading}
        style={{ backgroundColor: '#96bf48', borderColor: '#96bf48' }}
      >
        Publicar no Shopify
      </Button>
    </Tooltip>
  );
};

export default ShopifyPublishButton;
