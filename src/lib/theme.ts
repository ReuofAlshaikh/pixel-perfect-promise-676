import { useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "subvia.theme";
let theme: Theme | null = null;
const listeners = new Set<() => void>();

function get(): Theme {
  if (theme) return theme;
  try {
    theme = (localStorage.getItem(KEY) as Theme) || "light";
  } catch {
    theme = "light";
  }
  return theme;
}
export function setTheme(t: Theme) {
  theme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
  listeners.forEach((f) => f());
}
export function useTheme() {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    get,
    () => "light" as Theme,
  );
}
export function useDocumentTheme() {
  const t = useTheme();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", t === "dark");
  }, [t]);
}
