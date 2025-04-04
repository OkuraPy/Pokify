import { logger, task } from "@trigger.dev/sdk/v3";

// Defina o tipo de payload para a tarefa
type ProductExtractionPayload = {
  url: string;
  markdown: string;
  mode: string;
};

// Define a task para processar extrações de produtos
export const productExtractionTask = task({
  id: "product-extraction",
  // Máximo de 10 minutos de execução
  maxDuration: 10 * 60, // em segundos
  run: async (payload: ProductExtractionPayload) => {
    const { url, markdown, mode } = payload;
    
    logger.log("Iniciando a extração de produtos", { url, mode });
    
    try {
      // Como não podemos importar dinamicamente, precisamos passar o caminho absoluto
      // para o módulo que contém a função de extração
      const { extractProductDataWithOpenAI } = require("../../../lib/openai-extractor");
      
      // Chamar a função de extração
      const result = await extractProductDataWithOpenAI(url, markdown, undefined, mode);
      
      logger.log("Extração concluída com sucesso", { url });
      
      return result;
    } catch (error: any) {
      logger.error("Erro na extração de produtos", { 
        error: error.message, 
        url,
        mode 
      });
      
      throw error;
    }
  },
});
