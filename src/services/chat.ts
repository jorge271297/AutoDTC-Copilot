export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  answer: string;
}

function isChatResponse(value: unknown): value is ChatResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "answer" in value &&
    typeof value.answer === "string"
  );
}

function getErrorMessage(value: unknown): string | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "object" &&
    value.error !== null &&
    "message" in value.error &&
    typeof value.error.message === "string"
  ) {
    return value.error.message;
  }

  return undefined;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  signal: AbortSignal,
): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.slice(-20) }),
    signal,
  });

  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload) ?? `La API respondio con el estado ${response.status}.`,
    );
  }

  if (!isChatResponse(payload) || !payload.answer.trim()) {
    throw new Error("La respuesta del agente no tiene el formato esperado.");
  }

  return payload;
}
