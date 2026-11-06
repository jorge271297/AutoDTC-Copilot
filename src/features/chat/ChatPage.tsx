"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { sendChatMessage, type ChatMessage } from "../../services/chat";
import { getHealth } from "../../services/health";
import {
  readChatHistory,
  writeChatHistory,
  type ChatConversation,
} from "./chat-history";
import { useColorMode } from "../../theme/ThemeRegistry";

type ApiStatus =
  | { state: "checking" }
  | { state: "available" }
  | { state: "unavailable" };

type StorageStatus =
  | { state: "loading" }
  | { state: "ready" }
  | { state: "error"; reason: "read" | "write"; message: string };

const promptSuggestions = [
  "¿Qué significa el código P0301?",
  "Mi auto tiembla al frenar, ¿qué debería revisar?",
  "¿Qué datos necesitas para orientar un diagnóstico?",
];

function sortConversations(conversations: ChatConversation[]): ChatConversation[] {
  return [...conversations].sort(
    (first, second) =>
      new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
  );
}

function createTitle(message: string): string {
  const title = message.trim();
  return title.length > 42 ? `${title.slice(0, 39).trimEnd()}...` : title;
}

export function ChatPage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ state: "checking" });
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    null,
  );
  const [storageStatus, setStorageStatus] = useState<StorageStatus>({
    state: "loading",
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string>();
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [themeMenuAnchor, setThemeMenuAnchor] = useState<HTMLElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerFormRef = useRef<HTMLFormElement>(null);
  const { mode, resolvedMode, setMode, canPersistPreference } = useColorMode();

  const activeConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );
  const messages = activeConversation?.messages ?? [];

  useEffect(() => {
    const result = readChatHistory();

    if (result.ok) {
      setConversations(result.conversations);
      setSelectedConversationId(result.conversations[0]?.id ?? null);
      setStorageStatus({ state: "ready" });
      return;
    }

    setStorageStatus({ state: "error", reason: "read", message: result.message });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    getHealth(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) {
          setApiStatus({ state: "available" });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setApiStatus({ state: "unavailable" });
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (storageStatus.state !== "ready") {
      return;
    }

    const result = writeChatHistory(conversations);
    if (!result.ok) {
      setStorageStatus({ state: "error", reason: "write", message: result.message });
    }
  }, [conversations, storageStatus.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const apiStatusLabel = {
    checking: "Conectando...",
    available: "API disponible",
    unavailable: "API sin conexión",
  }[apiStatus.state];
  const apiStatusColor = (
    {
      checking: "default",
      available: "success",
      unavailable: "error",
    } satisfies Record<ApiStatus["state"], "default" | "success" | "error">
  )[apiStatus.state];
  const themeLabel = {
    system: "Sistema",
    light: "Claro",
    dark: "Oscuro",
  }[mode];

  function startNewChat() {
    setSelectedConversationId(null);
    setInput("");
    setChatError(undefined);
    setMobileHistoryOpen(false);
  }

  function deleteConversation(conversationId: string) {
    setConversations((current) =>
      current.filter((conversation) => conversation.id !== conversationId),
    );
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();

    if (!content || isSending || storageStatus.state === "loading") {
      return;
    }

    const now = new Date().toISOString();
    const conversationId = selectedConversationId ?? crypto.randomUUID();
    const currentConversation = conversations.find(
      (conversation) => conversation.id === conversationId,
    );
    const userMessage: ChatMessage = { role: "user", content };
    const nextMessages = [...(currentConversation?.messages ?? []), userMessage];
    const nextConversation: ChatConversation = {
      id: conversationId,
      title: currentConversation?.title ?? createTitle(content),
      createdAt: currentConversation?.createdAt ?? now,
      updatedAt: now,
      messages: nextMessages,
    };

    setConversations((current) =>
      sortConversations([
        nextConversation,
        ...current.filter((conversation) => conversation.id !== conversationId),
      ]),
    );
    setSelectedConversationId(conversationId);
    setInput("");
    setChatError(undefined);
    setIsSending(true);

    try {
      const result = await sendChatMessage(nextMessages, new AbortController().signal);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: result.answer,
      };

      setConversations((current) =>
        sortConversations(
          current.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  updatedAt: new Date().toISOString(),
                  messages: [...conversation.messages, assistantMessage],
                }
              : conversation,
          ),
        ),
      );
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : "No se pudo enviar el mensaje. Intenta de nuevo.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function retryHistorySave() {
    const result = writeChatHistory(conversations);
    if (result.ok) {
      setStorageStatus({ state: "ready" });
    } else {
      setStorageStatus({ state: "error", reason: "write", message: result.message });
    }
  }

  function renderHistoryPanel(onClose?: () => void) {
    return (
      <Box
        component="nav"
        aria-label="Historial de conversaciones"
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: "center", px: 0.5, py: 1 }}
        >
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: "primary.main",
              borderRadius: 2,
              fontSize: 13,
              fontWeight: 800,
              height: 34,
              width: 34,
            }}
          >
            AD
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 750, lineHeight: 1.1 }}>
              AutoDTC-Copilot
            </Typography>
            <Typography color="text.secondary" variant="caption">
              Diagnóstico OBD-II
            </Typography>
          </Box>
        </Stack>

        <Button
          onClick={() => {
            onClose?.();
            startNewChat();
          }}
          startIcon={<Box component="span" sx={{ fontSize: 20, lineHeight: 1 }}>+</Box>}
          variant="contained"
          sx={{ justifyContent: "flex-start", my: 2, py: 1.15 }}
        >
          Nueva conversación
        </Button>

        <Typography
          color="text.secondary"
          sx={{ px: 1, pb: 1, fontSize: 11, fontWeight: 700, letterSpacing: 0.8 }}
          variant="overline"
        >
          Recientes
        </Typography>
        <List disablePadding sx={{ display: "grid", gap: 0.5, overflowY: "auto" }}>
          {conversations.map((conversation) => (
            <Box
              key={conversation.id}
              sx={{
                alignItems: "center",
                display: "flex",
                gap: 0.25,
                minWidth: 0,
              }}
            >
              <ListItemButton
                aria-current={
                  conversation.id === selectedConversationId ? "page" : undefined
                }
                onClick={() => {
                  setSelectedConversationId(conversation.id);
                  setChatError(undefined);
                  setMobileHistoryOpen(false);
                }}
                selected={conversation.id === selectedConversationId}
                sx={{
                  borderRadius: 2,
                  minWidth: 0,
                  py: 1,
                  "&.Mui-selected": { bgcolor: "action.selected" },
                }}
              >
                <Typography noWrap variant="body2">
                  {conversation.title}
                </Typography>
              </ListItemButton>
              <Tooltip title={`Eliminar "${conversation.title}"`}>
                <IconButton
                  aria-label={`Eliminar conversación: ${conversation.title}`}
                  onClick={() => deleteConversation(conversation.id)}
                  size="small"
                  sx={{ flexShrink: 0 }}
                >
                  <Box component="span" aria-hidden="true" sx={{ fontSize: 18, lineHeight: 1 }}>
                    ×
                  </Box>
                </IconButton>
              </Tooltip>
            </Box>
          ))}
          {conversations.length === 0 && (
            <Typography color="text.secondary" sx={{ px: 1, py: 1.5 }} variant="body2">
              Tus conversaciones aparecerán aquí.
            </Typography>
          )}
        </List>

        <Box sx={{ flex: 1 }} />
        <Divider sx={{ my: 1.5 }} />
        <Typography color="text.secondary" sx={{ px: 0.5 }} variant="caption">
          El historial se guarda en este navegador.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        bgcolor: "background.default",
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <Box
        component="aside"
        sx={{
          bgcolor: "background.paper",
          borderRight: 1,
          borderColor: "divider",
          display: { xs: "none", md: "block" },
          flexShrink: 0,
          width: 276,
        }}
      >
        {renderHistoryPanel()}
      </Box>

      <Drawer
        onClose={() => setMobileHistoryOpen(false)}
        open={mobileHistoryOpen}
        slotProps={{ paper: { sx: { width: 290 } } }}
      >
        {renderHistoryPanel(() => setMobileHistoryOpen(false))}
      </Drawer>

      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
        <Box
          component="header"
          sx={{
            alignItems: "center",
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            minHeight: 64,
            px: { xs: 1.5, sm: 3 },
          }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Button
              onClick={() => setMobileHistoryOpen(true)}
              sx={{ display: { xs: "inline-flex", md: "none" }, minWidth: 0 }}
            >
              Historial
            </Button>
            <Typography component="h1" sx={{ fontWeight: 650 }} variant="subtitle1">
              {activeConversation?.title ?? "Nuevo chat"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Chip
              aria-live="polite"
              color={apiStatusColor}
              label={apiStatusLabel}
              size="small"
              variant="outlined"
            />
            <Tooltip
              title={
                canPersistPreference
                  ? `Tema ${themeLabel.toLowerCase()}`
                  : "La preferencia de tema no se pudo guardar en este navegador"
              }
            >
              <IconButton
                aria-label={`Cambiar tema. Tema actual: ${themeLabel.toLowerCase()}`}
                aria-haspopup="menu"
                aria-expanded={Boolean(themeMenuAnchor)}
                onClick={(event) => setThemeMenuAnchor(event.currentTarget)}
                size="small"
              >
                <Box component="span" aria-hidden="true" sx={{ fontSize: 21, lineHeight: 1 }}>
                  {resolvedMode === "dark" ? "☾" : "☀"}
                </Box>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={themeMenuAnchor}
              onClose={() => setThemeMenuAnchor(null)}
              open={Boolean(themeMenuAnchor)}
            >
              {(
                [
                  ["system", "Sistema (del dispositivo)"],
                  ["light", "Claro"],
                  ["dark", "Oscuro"],
                ] as const
              ).map(([value, label]) => (
                <MenuItem
                  key={value}
                  onClick={() => {
                    setMode(value);
                    setThemeMenuAnchor(null);
                  }}
                  selected={mode === value}
                >
                  {label}
                </MenuItem>
              ))}
            </Menu>
          </Stack>
        </Box>

        <Box
          aria-label="Conversación con el asistente OBD-II"
          component="section"
          sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}
        >
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: { xs: 1.5, sm: 3 } }}>
            {messages.length === 0 ? (
              <Container
                maxWidth="md"
                sx={{
                  alignItems: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minHeight: "100%",
                  py: 4,
                  textAlign: "center",
                }}
              >
                <Avatar
                  variant="rounded"
                  sx={{
                    bgcolor: "primary.main",
                    borderRadius: 3,
                    fontSize: 17,
                    fontWeight: 800,
                    height: 52,
                    mb: 2.5,
                    width: 52,
                  }}
                >
                  AD
                </Avatar>
                <Typography component="h2" sx={{ fontWeight: 700 }} variant="h4">
                  ¿Qué le pasa a tu auto?
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mt: 1, maxWidth: 540 }}
                  variant="body1"
                >
                  Comparte un código de falla o describe los síntomas. Te ayudamos a
                  entender qué revisar.
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gap: 1.25,
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    mt: 4,
                    width: "100%",
                  }}
                >
                  {promptSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      sx={{
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 3,
                        color: "text.primary",
                        justifyContent: "flex-start",
                        minHeight: 76,
                        px: 2,
                        textAlign: "left",
                        textTransform: "none",
                        "&:hover": {
                          bgcolor: "background.paper",
                          borderColor: "primary.main",
                        },
                      }}
                      variant="outlined"
                    >
                      <Typography variant="body2">{suggestion}</Typography>
                    </Button>
                  ))}
                </Box>
              </Container>
            ) : (
              <Container maxWidth="md" sx={{ py: { xs: 2.5, sm: 4 } }}>
                <Stack spacing={2.5}>
                  {messages.map((message, index) => {
                    const isUser = message.role === "user";
                    return (
                      <Stack
                        key={`${message.role}-${index}`}
                        direction="row"
                        spacing={1.25}
                        sx={{
                          alignItems: "flex-start",
                          justifyContent: isUser ? "flex-end" : "flex-start",
                        }}
                      >
                        {!isUser && (
                          <Avatar
                            variant="rounded"
                            sx={{
                              bgcolor: "primary.main",
                              borderRadius: 2,
                              fontSize: 10,
                              fontWeight: 800,
                              height: 30,
                              width: 30,
                            }}
                          >
                            AD
                          </Avatar>
                        )}
                        <Paper
                          elevation={0}
                          sx={{
                            bgcolor: isUser ? "primary.main" : "background.paper",
                            border: isUser ? 0 : 1,
                            borderColor: "divider",
                            borderRadius: isUser ? "20px 20px 5px 20px" : "5px 20px 20px",
                            color: isUser ? "primary.contrastText" : "text.primary",
                            maxWidth: { xs: "88%", sm: "78%" },
                            px: 2,
                            py: 1.5,
                          }}
                        >
                          <Typography
                            component="div"
                            sx={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}
                            variant="body1"
                          >
                            {message.content}
                          </Typography>
                        </Paper>
                      </Stack>
                    );
                  })}
                  {isSending && (
                    <Typography aria-live="polite" color="text.secondary" variant="body2">
                      El asistente está preparando una respuesta...
                    </Typography>
                  )}
                  <Box ref={messagesEndRef} />
                </Stack>
              </Container>
            )}
          </Box>

          <Box sx={{ bgcolor: "background.default", px: { xs: 1.5, sm: 3 }, pb: 2, pt: 1 }}>
            <Container maxWidth="md" disableGutters>
              {apiStatus.state === "unavailable" && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  No se pudo conectar con el servicio. Intenta enviar tu mensaje de nuevo
                  cuando esté disponible.
                </Alert>
              )}
              {storageStatus.state === "error" && (
                <Alert
                  action={
                    storageStatus.reason === "write" ? (
                      <Button color="inherit" onClick={retryHistorySave} size="small">
                        Reintentar
                      </Button>
                    ) : undefined
                  }
                  severity="warning"
                  sx={{ mb: 1.5 }}
                >
                  {storageStatus.message}
                </Alert>
              )}
              {chatError && (
                <Alert onClose={() => setChatError(undefined)} severity="error" sx={{ mb: 1.5 }}>
                  {chatError}
                </Alert>
              )}

              <Paper
                component="form"
                ref={composerFormRef}
                onSubmit={handleSubmit}
                elevation={0}
                sx={{
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 4,
                  boxShadow: "0 8px 30px rgba(28, 37, 54, 0.06)",
                  p: 1.25,
                }}
              >
                <TextField
                  fullWidth
                  aria-label="Escribe un mensaje sobre el vehículo"
                  disabled={isSending || storageStatus.state === "loading"}
                  maxRows={5}
                  multiline
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                      event.preventDefault();
                      composerFormRef.current?.requestSubmit();
                    }
                  }}
                  placeholder="Pregunta sobre un código OBD-II o describe los síntomas..."
                  value={input}
                  variant="standard"
                  slotProps={{
                    htmlInput: {
                      maxLength: 4000,
                      "aria-label": "Mensaje",
                    },
                    input: { disableUnderline: true },
                  }}
                />
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    mt: 1,
                    px: 0.5,
                  }}
                >
                  <Typography color="text.secondary" variant="caption">
                    Enter para nueva línea · Ctrl+Enter para enviar
                  </Typography>
                  <Tooltip title="Enviar mensaje">
                    <span>
                      <IconButton
                        aria-label="Enviar mensaje"
                        color="primary"
                        disabled={!input.trim() || isSending || storageStatus.state === "loading"}
                        type="submit"
                        sx={{
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          height: 38,
                          width: 38,
                          "&:hover": { bgcolor: "primary.dark" },
                          "&.Mui-disabled": {
                            bgcolor: "action.disabledBackground",
                            color: "action.disabled",
                          },
                        }}
                      >
                        <Box component="span" aria-hidden="true" sx={{ fontSize: 21, lineHeight: 1 }}>
                          ↑
                        </Box>
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Paper>
              <Typography
                color="text.secondary"
                sx={{ display: "block", mt: 1.25, textAlign: "center" }}
                variant="caption"
              >
                La orientación es informativa y no sustituye una inspección profesional.
              </Typography>
            </Container>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
