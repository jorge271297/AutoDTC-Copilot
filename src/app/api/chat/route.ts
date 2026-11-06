import {
  ChatConfigurationError,
  getAutomotiveChatResponse,
} from "../../../lib/chat";
import { parseChatMessages } from "../../../lib/chat-validation";
import { readJsonBody } from "../../../lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJsonBody(request, 64_000);
  if (!body.ok) {
    return Response.json(
      { error: { code: body.status === 413 ? "REQUEST_TOO_LARGE" : "INVALID_JSON", message: body.message } },
      { status: body.status },
    );
  }

  const messages = parseChatMessages(body.value);
  if (!messages) {
    return Response.json(
      {
        error: {
          code: "INVALID_CHAT_REQUEST",
          message: "Envia de 1 a 20 mensajes validos y termina con un mensaje del usuario.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const answer = await getAutomotiveChatResponse(messages);
    return Response.json({ answer });
  } catch (error) {
    if (error instanceof ChatConfigurationError) {
      console.error("El servicio de chat no esta configurado correctamente.");
      return Response.json(
        {
          error: {
            code: "CHAT_NOT_AVAILABLE",
            message: "El asistente no esta disponible en este momento. Intenta de nuevo mas tarde.",
          },
        },
        { status: 503 },
      );
    }

    console.error(
      "No se pudo completar la solicitud al proveedor de IA.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return Response.json(
      {
        error: {
          code: "CHAT_PROVIDER_ERROR",
          message: "No se pudo obtener respuesta del agente. Intenta de nuevo en un momento.",
        },
      },
      { status: 502 },
    );
  }
}
