import { createAppRoute } from "@trigger.dev/nextjs";
import { client } from "@/trigger";

// Criando o endpoint para o Trigger.dev
// Este endpoint u00e9 usado para se comunicar com o servidor do Trigger.dev
export const { POST, dynamic } = createAppRoute(client);

// Configurando o endpoint para ser executado em tempo de execuçu00e3o
export const runtime = "nodejs";
