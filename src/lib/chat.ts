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

type ChatProvider = "foundry" | "azure-openai";

function getChatProvider(): ChatProvider {
  const provider = process.env.AZURE_AI_PROVIDER?.trim().toLowerCase() || "foundry";
  if (provider !== "foundry" && provider !== "azure-openai") {
    throw new ChatConfigurationError();
  }
  return provider;
}

function getHttpsEndpoint(value: string): string {
  let endpoint: URL;
  try {
    endpoint = new URL(value);
  } catch {
    throw new ChatConfigurationError();
  }

  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) {
    throw new ChatConfigurationError();
  }

  return endpoint.toString().replace(/\/+$/, "");
}

async function getFoundryChatResponse(messages: ChatMessage[]): Promise<string> {
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

async function getAzureOpenAIChatResponse(messages: ChatMessage[]): Promise<string> {
  const endpointValue = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME?.trim();
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION?.trim();

  if (!endpointValue || !apiKey || !deployment || !apiVersion) {
    throw new ChatConfigurationError();
  }

  const searchEndpointValue = process.env.AZURE_SEARCH_ENDPOINT?.trim();
  const searchKey = process.env.AZURE_SEARCH_KEY?.trim();
  const searchIndex = process.env.AZURE_SEARCH_INDEX?.trim();

  const endpoint = getHttpsEndpoint(endpointValue);
  const url = new URL(
    `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions`,
  );
  url.searchParams.set("api-version", apiVersion);

  let dataSources:
    | {
        type: "azure_search";
        parameters: {
          endpoint: string;
          index_name: string;
          authentication: { type: "api_key"; key: string };
        };
      }[]
    | undefined;

  if (searchEndpointValue || searchKey || searchIndex) {
    if (!searchEndpointValue || !searchKey || !searchIndex) {
      throw new ChatConfigurationError();
    }

    dataSources = [
      {
        type: "azure_search",
        parameters: {
          endpoint: getHttpsEndpoint(searchEndpointValue),
          index_name: searchIndex,
          authentication: { type: "api_key", key: searchKey },
        },
      },
    ];
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: automotiveInstructions },
        ...messages,
      ],
      temperature: 0.2,
      ...(dataSources ? { data_sources: dataSources } : {}),
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error("Azure OpenAI devolvio un error.");
  }

  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("choices" in result)) {
    throw new Error("Azure OpenAI devolvio una respuesta invalida.");
  }

  const choices = result.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : undefined;
  if (
    typeof firstChoice !== "object" ||
    firstChoice === null ||
    !("message" in firstChoice) ||
    typeof firstChoice.message !== "object" ||
    firstChoice.message === null ||
    !("content" in firstChoice.message) ||
    typeof firstChoice.message.content !== "string" ||
    !firstChoice.message.content.trim()
  ) {
    throw new Error("Azure OpenAI no devolvio texto.");
  }

  return firstChoice.message.content.trim();
}

export async function getAutomotiveChatResponse(
  messages: ChatMessage[],
): Promise<string> {
  switch (getChatProvider()) {
    case "foundry":
      return getFoundryChatResponse(messages);
    case "azure-openai":
      return getAzureOpenAIChatResponse(messages);
  }
}
