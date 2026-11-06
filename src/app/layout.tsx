import type { Metadata } from "next";
import { ThemeRegistry } from "../theme/ThemeRegistry";

export const metadata: Metadata = {
  title: "AutoDTC-Copilot",
  description: "Asistente de diagnostico automotriz y codigos de error OBD-II.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
