import Link from "next/link";
import { Box, Button, Container, Paper, Typography } from "@mui/material";

export default function NotFoundPage() {
  return (
    <Box component="main" sx={{ py: 8 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
          <Typography component="h1" gutterBottom variant="h4">
            Pagina no encontrada
          </Typography>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button component="span" variant="contained">
              Volver al inicio
            </Button>
          </Link>
        </Paper>
      </Container>
    </Box>
  );
}
