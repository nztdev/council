"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isThemeId,
  type ThemeId,
} from "@/lib/themes";

interface ThemeState {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

// For now the choice is remembered per device (localStorage). Moving it to
// the signed-in account later only means changing this one file: read the
// saved value from the profile instead, and save it there in setTheme().
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always starts as the default so the first render matches the
  // server-rendered HTML exactly; the real saved theme is applied right
  // after mount (the <head> script already painted it, so there's no flash).
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeId(saved)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(saved);
      }
    } catch {
      // storage unavailable (private mode etc.): keep the default
    }
  }, []);

  function setTheme(id: ThemeId) {
    setThemeState(id);
    document.documentElement.setAttribute("data-theme", id);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // ignore: the theme still applies for this visit
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
