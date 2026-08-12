import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'system' | 'light' | 'dark';
export type ResolvedTheme = Exclude<Theme, 'system'>;

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'open-wearables-theme';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export const themeInitializationScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem('${THEME_STORAGE_KEY}');
    const theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'system';
    const resolvedTheme = theme === 'system'
      ? (window.matchMedia('${SYSTEM_THEME_QUERY}').matches ? 'dark' : 'light')
      : theme;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  } catch {}
})();`;

function getStoredTheme(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : 'system';
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light';
}

// Suppress CSS transitions for the duration of the theme swap so every element
// recolors in the same frame instead of each running its own transition and
// visibly lagging behind the rest of the page.
function withoutTransitions(swap: () => void): void {
  const style = document.createElement('style');
  style.appendChild(
    document.createTextNode(
      '*,*::before,*::after{transition:none !important}'
    )
  );
  document.head.appendChild(style);

  swap();

  // Force a reflow so the transition-less styles are flushed before we remove
  // the override on the next tick.
  window.getComputedStyle(document.body).transition;
  window.setTimeout(() => {
    document.head.removeChild(style);
  }, 0);
}

function applyTheme(theme: Theme): ResolvedTheme {
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
  const root = document.documentElement;

  withoutTransitions(() => {
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  });

  return resolvedTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedTheme = getStoredTheme();
    setThemeState(storedTheme);
    setResolvedTheme(applyTheme(storedTheme));
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
    const updateTheme = () => setResolvedTheme(applyTheme(theme));

    updateTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [isInitialized, theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, setTheme, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
