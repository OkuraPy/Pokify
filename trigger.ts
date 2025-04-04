import { TriggerClient } from "@trigger.dev/sdk";

// Criação do cliente Trigger.dev (versu00e3o 2)
export const client = new TriggerClient({
  id: "pokify",
  apiKey: process.env.TRIGGER_API_KEY || "",
});
