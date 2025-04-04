import { client } from "@/trigger";
import { extractProductDataWithOpenAI } from "@/lib/openai-extractor";

// Definiu00e7u00e3o do job de extrau00e7u00e3o de produtos para o Trigger.dev v2
export const extractProductJob = client.defineJob({
  id: "extract-product-openai",
  name: "Extrau00e7u00e3o de Produto com OpenAI",
  version: "1.0.0",

  // Funu00e7u00e3o principal do job
  run: async (payload, io) => {
    await io.logger.info("Iniciando extrau00e7u00e3o de produto", { 
      url: payload.url, 
      mode: payload.mode || "standard" 
    });
    
    try {
      // Usar a funu00e7u00e3o existente para extrau00e7u00e3o
      const result = await extractProductDataWithOpenAI(
        payload.url,
        payload.markdown,
        payload.screenshot,
        payload.mode
      );
      
      await io.logger.info("Extrau00e7u00e3o concluu00edda com sucesso", { 
        success: result.success,
        hasData: !!result.data 
      });
      
      return result;
    } catch (error: any) {
      await io.logger.error("Erro na extrau00e7u00e3o", { error: error.message });
      
      return {
        success: false,
        error: error.message || "Erro desconhecido na extrau00e7u00e3o de dados"
      };
    }
  },
});
