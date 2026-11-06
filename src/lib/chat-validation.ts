import "server-only";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const maxChatMessages = 20;
const maxChatMessageLength = 4000;
const maxChatInputLength = 16000;

function isChatMessage(value: unknown): value is ChatMessage {
  if (
    typeof value !== "object" ||
    value === null ||
    !("role" in value) ||
    !("content" in value)
  ) {
    return false;
  }

  return (
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string" &&
    value.content.trim().length > 0 &&
    value.content.length <= maxChatMessageLength
  );
}

export function parseChatMessages(value: unknown): ChatMessage[] | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    !("messages" in value) ||
    !Array.isArray(value.messages) ||
    value.messages.length === 0 ||
    value.messages.length > maxChatMessages ||
    !value.messages.every(isChatMessage)
  ) {
    return undefined;
  }

  const messages = value.messages.map((message) => ({
    role: message.role,
    content: message.content.trim(),
  }));
  const totalLength = messages.reduce((total, message) => total + message.content.length, 0);

  if (
    messages[messages.length - 1]?.role !== "user" ||
    totalLength > maxChatInputLength
  ) {
    return undefined;
  }

  return messages;
}
