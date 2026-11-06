import type { ChatMessage } from "../../services/chat";

const historyStorageKey = "proyecto-etapa2.chat-history.v1";

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export type ChatHistoryReadResult =
  | { ok: true; conversations: ChatConversation[] }
  | { ok: false; message: string };

export type ChatHistoryWriteResult =
  | { ok: true }
  | { ok: false; message: string };

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "role" in value &&
    (value.role === "user" || value.role === "assistant") &&
    "content" in value &&
    typeof value.content === "string" &&
    value.content.length > 0 &&
    value.content.length <= 20_000
  );
}

function isChatConversation(value: unknown): value is ChatConversation {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    !("title" in value) ||
    !("createdAt" in value) ||
    !("updatedAt" in value) ||
    !("messages" in value)
  ) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.title === "string" &&
    value.title.length > 0 &&
    value.title.length <= 100 &&
    typeof value.createdAt === "string" &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    typeof value.updatedAt === "string" &&
    Number.isFinite(Date.parse(value.updatedAt)) &&
    Array.isArray(value.messages) &&
    value.messages.every(isChatMessage)
  );
}

export function readChatHistory(): ChatHistoryReadResult {
  try {
    const storedHistory = window.localStorage.getItem(historyStorageKey);
    if (storedHistory === null) {
      return { ok: true, conversations: [] };
    }

    const value: unknown = JSON.parse(storedHistory);
    if (!Array.isArray(value) || !value.every(isChatConversation)) {
      return {
        ok: false,
        message:
          "El historial guardado no se pudo reconocer. Tus conversaciones nuevas permanecerán solo abiertas en esta página.",
      };
    }

    const conversations = [...value].sort(
      (first, second) =>
        Date.parse(second.updatedAt) - Date.parse(first.updatedAt),
    );
    return { ok: true, conversations };
  } catch {
    return {
      ok: false,
      message:
        "El navegador no permitió leer el historial. Tus conversaciones nuevas permanecerán solo abiertas en esta página.",
    };
  }
}

export function writeChatHistory(
  conversations: ChatConversation[],
): ChatHistoryWriteResult {
  try {
    window.localStorage.setItem(historyStorageKey, JSON.stringify(conversations));
    return { ok: true };
  } catch {
    return {
      ok: false,
      message:
        "No se pudo guardar el historial en este navegador. Revisa el espacio disponible o los permisos de almacenamiento.",
    };
  }
}
