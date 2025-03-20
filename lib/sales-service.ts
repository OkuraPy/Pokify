import { supabase } from './supabase';

/**
 * Obtém estatísticas de vendas de uma loja específica
 * Atualmente usando dados simulados, mas preparado para acessar uma tabela real no futuro
 */
export async function getSalesStats(storeId: string) {
  try {
    // Dados simulados para demonstração
    // Em um ambiente real, isso seria substituído por uma consulta ao banco de dados
    const vendasSimuladas = [
      { id: 1, valor_total: 129.99, qtd: 1, data: new Date(), store_id: storeId },
      { id: 2, valor_total: 259.98, qtd: 2, data: new Date(), store_id: storeId },
      { id: 3, valor_total: 89.90, qtd: 1, data: new Date(), store_id: storeId },
      { id: 4, valor_total: 499.99, qtd: 3, data: new Date(), store_id: storeId },
    ];
    
    // Calcular estatísticas
    const totalSales = vendasSimuladas.length;
    
    // Calcular receita total (soma de valor_total)
    const totalRevenue = vendasSimuladas.reduce((sum, venda) => sum + (venda.valor_total || 0), 0);
    
    // Calcular valor médio por venda
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Calcular total de itens vendidos (soma de qtd)
    const totalItems = vendasSimuladas.reduce((sum, venda) => sum + (venda.qtd || 0), 0);
    
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
 * Atualmente usando dados simulados
 */
export async function getProductSales(productId: string) {
  try {
    // Dados simulados para demonstração
    const vendasSimuladas = [
      { id: 1, valor_total: 129.99, qtd: 1, data: new Date(), produto_id: productId },
      { id: 2, valor_total: 129.99, qtd: 1, data: new Date(), produto_id: productId },
      { id: 3, valor_total: 259.98, qtd: 2, data: new Date(), produto_id: productId },
    ];
    
    // Calcular estatísticas específicas do produto
    const totalSales = vendasSimuladas.length;
    const totalRevenue = vendasSimuladas.reduce((sum, venda) => sum + (venda.valor_total || 0), 0);
    const totalQuantity = vendasSimuladas.reduce((sum, venda) => sum + (venda.qtd || 0), 0);
    
    return {
      sales: vendasSimuladas,
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