import { supabase } from './supabase';

/**
 * Obtém estatísticas de vendas de uma loja específica
 */
export async function getSalesStats(storeId: string) {
  try {
    // Obter todas as vendas da loja
    const { data: vendas, error } = await supabase
      .from('vendas')
      .select('*')
      .eq('store_id', storeId);
      
    if (error) {
      console.error('Erro ao obter vendas:', error);
      throw error;
    }
    
    // Calcular estatísticas
    const totalSales = vendas.length;
    
    // Calcular receita total (soma de valor_total)
    const totalRevenue = vendas.reduce((sum, venda) => sum + (venda.valor_total || 0), 0);
    
    // Calcular valor médio por venda
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Calcular total de itens vendidos (soma de qtd)
    const totalItems = vendas.reduce((sum, venda) => sum + (venda.qtd || 0), 0);
    
    return {
      totalSales,
      totalRevenue,
      averageOrderValue,
      totalItems
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas de vendas:', error);
    // Retornar valores padrão em caso de erro
    return {
      totalSales: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalItems: 0
    };
  }
}

/**
 * Obtém detalhes de vendas por produto
 */
export async function getProductSales(productId: string) {
  try {
    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .eq('produto_id', productId);
      
    if (error) {
      console.error('Erro ao obter vendas do produto:', error);
      throw error;
    }
    
    // Calcular estatísticas específicas do produto
    const totalSales = data.length;
    const totalRevenue = data.reduce((sum, venda) => sum + (venda.valor_total || 0), 0);
    const totalQuantity = data.reduce((sum, venda) => sum + (venda.qtd || 0), 0);
    
    return {
      sales: data,
      stats: {
        totalSales,
        totalRevenue,
        totalQuantity
      }
    };
  } catch (error) {
    console.error('Erro ao obter vendas do produto:', error);
    return {
      sales: [],
      stats: {
        totalSales: 0,
        totalRevenue: 0,
        totalQuantity: 0
      }
    };
  }
} 