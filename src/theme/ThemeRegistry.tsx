"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import {
  createAppTheme,
  type ColorMode,
  type ColorModePreference,
} from "./theme";

const colorModeStorageKey = "autodtc.color-mode.v1";

interface ColorModeContextValue {
  mode: ColorModePreference;
  resolvedMode: ColorMode;
  setMode: (mode: ColorModePreference) => void;
  canPersistPreference: boolean;
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

interface ThemeRegistryProps {
  children: React.ReactNode;
}

export function ThemeRegistry({ children }: ThemeRegistryProps) {
  const [mode, setMode] = useState<ColorModePreference>("system");
  const [resolvedMode, setResolvedMode] = useState<ColorMode>("light");
  const [canPersistPreference, setCanPersistPreference] = useState(true);

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem(colorModeStorageKey);
      if (savedMode === "system" || savedMode === "light" || savedMode === "dark") {
        setMode(savedMode);
      }
    } catch {
      setCanPersistPreference(false);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateResolvedMode = () => {
      setResolvedMode(mode === "system" ? (mediaQuery.matches ? "dark" : "light") : mode);
    };

    updateResolvedMode();
    if (mode !== "system") {
      return;
    }

    mediaQuery.addEventListener("change", updateResolvedMode);
    return () => mediaQuery.removeEventListener("change", updateResolvedMode);
  }, [mode]);

  function updateMode(nextMode: ColorModePreference) {
    setMode(nextMode);
    try {
      window.localStorage.setItem(colorModeStorageKey, nextMode);
      setCanPersistPreference(true);
    } catch {
      setCanPersistPreference(false);
    }
  }

  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ColorModeContext.Provider
          value={{ mode, resolvedMode, setMode: updateMode, canPersistPreference }}
        >
          {children}
        </ColorModeContext.Provider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

export function useColorMode(): ColorModeContextValue {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error("useColorMode debe usarse dentro de ThemeRegistry.");
  }
  return context;
}
