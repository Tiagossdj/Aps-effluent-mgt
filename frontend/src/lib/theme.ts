// Store de tema (dark/light) sincronizado com a classe `.dark` no <html> e
// com localStorage. Usa useSyncExternalStore (não useState + useEffect) para
// ler o estado aplicado pelo script inline de `layout.tsx` antes da hidratação
// sem disparar o lint `react-hooks/set-state-in-effect` — mesmo padrão usado
// em `sidebar-nav.tsx` para detectar o mount no cliente.
import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "theme";

const listeners = new Set<() => void>();

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage indisponível (modo privado, etc.) — tema não persiste,
    // mas continua funcionando na sessão atual.
  }
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  return { theme, toggleTheme };
}
