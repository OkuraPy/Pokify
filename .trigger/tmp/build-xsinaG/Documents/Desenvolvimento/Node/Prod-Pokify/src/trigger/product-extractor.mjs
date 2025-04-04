import {
  logger,
  task
} from "../../../../../../chunk-EAQHZATL.mjs";
import {
  __require,
  init_esm
} from "../../../../../../chunk-XVMCOVNG.mjs";

// src/trigger/product-extractor.ts
init_esm();
var productExtractionTask = task({
  id: "product-extraction",
  // Máximo de 10 minutos de execução
  maxDuration: 10 * 60,
  // em segundos
  run: async (payload) => {
    const { url, markdown, mode } = payload;
    logger.log("Iniciando a extração de produtos", { url, mode });
    try {
      const { extractProductDataWithOpenAI } = __require("../../../lib/openai-extractor");
      const result = await extractProductDataWithOpenAI(url, markdown, void 0, mode);
      logger.log("Extração concluída com sucesso", { url });
      return result;
    } catch (error) {
      logger.error("Erro na extração de produtos", {
        error: error.message,
        url,
        mode
      });
      throw error;
    }
  }
});
export {
  productExtractionTask
};
//# sourceMappingURL=product-extractor.mjs.map
