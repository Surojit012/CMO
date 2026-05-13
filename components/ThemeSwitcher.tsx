"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun, Laptop } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex bg-[var(--color-bg)] rounded-lg p-1 border border-[var(--color-border)]">
      <button
        onClick={() => setTheme("dark")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
          theme === "dark" 
            ? "bg-[var(--color-surface-hover)] text-[var(--color-fg)] shadow-sm" 
            : "text-[var(--color-muted)] hover:text-[var(--color-secondary)]"
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
        Dark
      </button>
      <button
        onClick={() => setTheme("light")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
          theme === "light" 
            ? "bg-[var(--color-surface-hover)] text-[var(--color-fg)] shadow-sm" 
            : "text-[var(--color-muted)] hover:text-[var(--color-secondary)]"
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
        Light
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
          theme === "system" 
            ? "bg-[var(--color-surface-hover)] text-[var(--color-fg)] shadow-sm" 
            : "text-[var(--color-muted)] hover:text-[var(--color-secondary)]"
        }`}
      >
        <Laptop className="w-3.5 h-3.5" />
        Auto
      </button>
    </div>
  );
}
