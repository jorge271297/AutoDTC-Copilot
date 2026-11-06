import { useEffect, useState } from "react";
import { Alert, Box, Chip, Container, Paper, Stack, Typography } from "@mui/material";
import { getHealth } from "../../services/health";

type ApiStatus =
  | { state: "checking" }
  | { state: "available" }
  | { state: "unavailable" };

export function ChatPage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ state: "checking" });

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

  const statusLabel = {
    checking: "Comprobando API...",
    available: "API disponible",
    unavailable: "API no disponible",
  }[apiStatus.state];
  const statusColor = (
    {
      checking: "default",
      available: "success",
      unavailable: "error",
    } satisfies Record<ApiStatus["state"], "default" | "success" | "error">
  )[apiStatus.state];

  return (
    <Box
      component="main"
      sx={{
        alignItems: "center",
        display: "flex",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          component="section"
          elevation={0}
          sx={{ border: 1, borderColor: "divider", p: { xs: 3, sm: 6 } }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography color="primary" sx={{ fontWeight: 700 }} variant="overline">
                Proyecto Etapa 2
              </Typography>
              <Typography component="h1" gutterBottom variant="h3">
                Asistente de IA
              </Typography>
              <Typography color="text.secondary" variant="body1">
                La base de la aplicacion esta lista. La experiencia conversacional
                y la conexion con Microsoft Foundry se implementaran sobre esta
                estructura.
              </Typography>
            </Box>

            <Chip
              aria-live="polite"
              color={statusColor}
              label={statusLabel}
              sx={{ alignSelf: "flex-start" }}
              variant="outlined"
            />

            {apiStatus.state === "unavailable" && (
              <Alert severity="warning">
                No se pudo conectar con la API. Verifica que el servidor este
                ejecutandose con <code>npm run dev</code>.
              </Alert>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
