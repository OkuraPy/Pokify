import { client } from "@/trigger";
import { extractProductDataWithOpenAI } from "@/lib/openai-extractor";

// Definindu00e7u00e3o do job de extrau00e7u00e3o de produtos
export const extractJob = client.defineJob({
  id: "extract-product-job",
  name: "Extrau00e7u00e3o de Produto",
  version: "1.0.0",
  // Usar o webhook como trigger
  trigger: client.triggers.webhook({
    name: "extract-product",
    schema: {
      type: "object",
      properties: {
        url: { type: "string" },
        markdown: { type: "string" },
        screenshot: { type: "string", nullable: true },
        mode: { type: "string", nullable: true },
      },
      required: ["url", "markdown"],
    },
  }),
  // Implementau00e7u00e3o do job
  run: async (payload, io) => {
    await io.logger.info("Iniciando extrau00e7u00e3o de produto", {
      url: payload.url,
      mode: payload.mode || "standard",
    });

    try {
      // Usar a funu00e7u00e3o existente para extrau00e7u00e3o
      const result = await extractProductDataWithOpenAI(
        payload.url,
        payload.markdown,
        payload.screenshot,
        payload.mode
      );

      await io.logger.info("Extrau00e7u00e3o concluu00edda", {
        success: result.success,
        hasData: !!result.data,
      });

      return result;
    } catch (error: any) {
      await io.logger.error("Erro na extrau00e7u00e3o", {
        error: error.message,
      });

      return {
        success: false,
        error: error.message || "Erro desconhecido na extrau00e7u00e3o",
      };
    }
  },
});
