import { createNextRoute } from "@trigger.dev/nextjs";
import { client } from "@/trigger";

// Endpoint para o Trigger.dev na versu00e3o 2
export const { GET, POST, PUT } = createNextRoute(client);
