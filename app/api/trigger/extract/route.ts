import { NextResponse } from "next/server";
import { client } from "@/trigger";
import { extractProductDataWithOpenAI } from "@/lib/openai-extractor";

// Em vez de tentar usar a API completa do Trigger.dev, vamos simplificar
// e usar apenas o cliente para enviar eventos
export async function processExtraction(
  url: string, 
  markdown: string, 
  screenshot?: string,
  mode?: string
) {
  try {
    // Executar a extrau00e7u00e3o diretamente
    return await extractProductDataWithOpenAI(
      url,
      markdown,
      screenshot,
      mode
    );
  } catch (error: any) {
    console.error("Erro na extrau00e7u00e3o:", error);
    return {
      success: false,
      error: error.message || "Erro na extrau00e7u00e3o de dados",
    };
  }
}

// Endpoint do webhook simplificado
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    if (!payload.url || !payload.markdown) {
      return NextResponse.json({
        success: false,
        error: "URL e markdown su00e3o obrigatu00f3rios"
      }, { status: 400 });
    }
    
    // Processar a extrau00e7u00e3o em uma Promise para ter um processamento assu00edncrono
    // simulando o comportamento do Trigger.dev
    const jobId = Date.now().toString();
    
    // Inicia o processamento em segundo plano
    setTimeout(async () => {
      try {
        await processExtraction(
          payload.url,
          payload.markdown,
          payload.screenshot,
          payload.mode
        );
        // Aqui armazenaru00edamos o resultado em um banco de dados
        // para ser consultado posteriormente
      } catch (error) {
        console.error("Erro no processamento assu00edncrono:", error);
      }
    }, 0);
    
    return NextResponse.json({
      success: true,
      jobId,
      status: "processing",
      message: "Extrau00e7u00e3o iniciada em segundo plano"
    });
  } catch (error: any) {
    console.error("Erro no webhook:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
