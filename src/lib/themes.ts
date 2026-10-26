// The visual themes the app offers. This file is plain data (no React) so
// it can be imported from the server-rendered layout as well as from
// client components.
//
// The actual colors, fonts and shapes for each theme live in
// src/app/globals.css under [data-theme="<id>"]. Adding a theme means:
// 1) add an entry here, 2) add a matching [data-theme] block in
// globals.css. Nothing else in the app needs to change.

export type ThemeId = "chamber" | "midnight" | "pop";

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
  /** Hard-coded preview colors for the picker, so each option can show
   * its own look while a different theme is active. */
  swatch: { bg: string; surface: string; accent: string; ink: string };
}

export const DEFAULT_THEME: ThemeId = "chamber";

export const THEME_STORAGE_KEY = "council:theme";

export const THEMES: ThemeOption[] = [
  {
    id: "chamber",
    label: "Chamber",
    description: "Deep green, serif headlines, gold details.",
    swatch: { bg: "#F6F8F7", surface: "#FFFFFF", accent: "#0E3B2E", ink: "#0E3B2E" },
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Dark and sharp, with a violet accent.",
    swatch: { bg: "#0B0D14", surface: "#141826", accent: "#9D8FFF", ink: "#F2F3F8" },
  },
  {
    id: "pop",
    label: "Pop",
    description: "Bright, bold outlines and color blocks.",
    swatch: { bg: "#F4F1FF", surface: "#FFFFFF", accent: "#3D5AFE", ink: "#111111" },
  },
];

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

// Runs in <head> before the page paints, so a returning visitor never
// sees a flash of the default theme before their own loads. Kept as a
// string because it must execute before React does.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t==="chamber"||t==="midnight"||t==="pop"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;
