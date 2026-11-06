import "server-only";
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import type { ChatMessage } from "./chat-validation";

const automotiveInstructions = [
  "Eres un asistente especializado en diagnostico automotriz y codigos OBD-II.",
  "Responde en espanol salvo que el usuario solicite otro idioma.",
  "Interpreta codigos DTC, sintomas y causas probables; ordena las causas por probabilidad y explica que datos adicionales hacen falta.",
  "Cuando sea pertinente, solicita ano, marca, modelo, motor, kilometraje, codigos y condiciones en que aparece la falla.",
  "Distingue entre una orientacion y un diagnostico confirmado. Recomienda consultar el manual de servicio o a un tecnico calificado.",
  "Prioriza la seguridad: si hay una luz roja, perdida de frenos/direccion, sobrecalentamiento o riesgo inmediato, recomienda detener el vehiculo en un lugar seguro y pedir asistencia.",
  "No recomiendes desactivar sistemas de seguridad ni evadir controles de emisiones.",
].join(" ");

export class ChatConfigurationError extends Error {
  constructor() {
    super("La configuracion del proveedor de IA esta incompleta.");
    this.name = "ChatConfigurationError";
  }
}

export async function getAutomotiveChatResponse(
  messages: ChatMessage[],
): Promise<string> {
  const endpoint = process.env.AZURE_AI_PROJECT_ENDPOINT?.trim();
  const agentName = process.env.AZURE_AI_AGENT_NAME?.trim();

  if (!endpoint || !agentName) {
    throw new ChatConfigurationError();
  }

  const project = new AIProjectClient(endpoint, new DefaultAzureCredential());
  const openAIClient = project.getOpenAIClient();
  const result = await openAIClient.responses.create(
    {
      input: [{ role: "developer", content: automotiveInstructions }, ...messages],
    },
    {
      body: {
        agent: { name: agentName, type: "agent_reference" },
      },
    },
  );

  if (!result.output_text.trim()) {
    throw new Error("El agente no devolvio texto.");
  }

  return result.output_text.trim();
}
