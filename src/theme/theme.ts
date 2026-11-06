import { createTheme } from "@mui/material/styles";

export type ColorModePreference = "system" | "light" | "dark";
export type ColorMode = Exclude<ColorModePreference, "system">;

export function createAppTheme(mode: ColorMode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: isDark
        ? {
            main: "#7db8f5",
            dark: "#4b8fd1",
            light: "#b5d8ff",
            contrastText: "#10243b",
          }
        : {
            main: "#1769aa",
            dark: "#0f4c81",
            light: "#e5f1fc",
            contrastText: "#ffffff",
          },
      background: isDark
        ? {
            default: "#101820",
            paper: "#18232e",
          }
        : {
            default: "#f4f7fb",
            paper: "#ffffff",
          },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
    },
  });
}
