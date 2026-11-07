
export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'charter-theme';
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }

  return 'system';
}

export function applyTheme(theme: Theme): void {
  const prefersDark = window.matchMedia(DARK_MODE_QUERY).matches;

  const resolvedTheme =
    theme === 'system'
      ? prefersDark ? 'dark' : 'light'
      : theme;

  document.documentElement.dataset.theme = resolvedTheme;
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function initializeTheme(): () => void {
  const mediaQuery = window.matchMedia(DARK_MODE_QUERY);

  applyTheme(getTheme());

  const handleSystemChange = () => {
    if (getTheme() === 'system') {
      applyTheme('system');
    }
  };

  mediaQuery.addEventListener('change', handleSystemChange);

  return () => {
    mediaQuery.removeEventListener('change', handleSystemChange);
  };
}
