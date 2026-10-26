"use client";

import { Check } from "lucide-react";
import { THEMES } from "@/lib/themes";
import { useTheme } from "@/lib/theme";

/** "Appearance" chooser: one tappable row per theme, each previewing its
 * own colors regardless of which theme is currently active. */
export function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <fieldset className="mb-8">
      <legend className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
        Appearance
      </legend>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Appearance">
        {THEMES.map((option) => {
          const selected = theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(option.id)}
              className="ui-card flex items-center gap-4 p-3 text-left transition-colors"
              style={selected ? { borderColor: "var(--color-indigo)" } : undefined}
            >
              <span
                aria-hidden="true"
                className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl border"
                style={{
                  background: option.swatch.bg,
                  borderColor: option.swatch.ink + "33",
                }}
              >
                <span
                  className="absolute left-1.5 right-1.5 top-2 h-5 rounded-md"
                  style={{ background: option.swatch.surface }}
                />
                <span
                  className="absolute bottom-1.5 left-1.5 h-2 w-8 rounded-full"
                  style={{ background: option.swatch.accent }}
                />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-display font-semibold">{option.label}</span>
                <span className="block text-sm text-ink-soft">{option.description}</span>
              </span>
              {selected && <Check className="text-indigo shrink-0" size={20} />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
