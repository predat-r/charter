
import { useState } from 'preact/hooks';
import { getTheme, setTheme, type Theme } from '../lib/theme';

const themes: Theme[] = ['system', 'light', 'dark'];

export function Header() {
  const [theme, updateTheme] = useState<Theme>(getTheme);

  function cycleTheme() {
    const index = themes.indexOf(theme);
    const nextTheme = themes[(index + 1) % themes.length];

    setTheme(nextTheme);
    updateTheme(nextTheme);
  }

  return (
    <header class="flex h-16 items-center justify-between border-b border-zinc-200 px-6 dark:border-zinc-800">
      <a href="/" class="text-lg font-semibold tracking-tight">
        Charter
      </a>

      <button
        type="button"
        onClick={cycleTheme}
        aria-label={`Appearance: ${theme}. Click to change.`}
        title="Change appearance"
        class="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium capitalize transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {theme}
      </button>
    </header>
  );
}
