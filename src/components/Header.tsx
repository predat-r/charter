
import { useEffect, useRef } from 'preact/hooks';
import { getTheme, setTheme, type Theme } from '../lib/theme';

import '@spectrum-web-components/picker/sp-picker.js';
import '@spectrum-web-components/menu/sp-menu-item.js';

type ThemePicker = HTMLElement & {
  value: string;
};

const isTheme = (value: string): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system';

export function Header() {
  const pickerRef = useRef<ThemePicker>(null);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;

    picker.value = getTheme();

    const handleChange = () => {
      if (isTheme(picker.value)) {
        setTheme(picker.value);
      }
    };

    picker.addEventListener('change', handleChange);

    return () => {
      picker.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <header class="flex h-16 items-center justify-between border-b border-zinc-200 px-6 dark:border-zinc-800">
      <a
        href="/"
        class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
      >
        Charter
      </a>

      <sp-picker
        ref={pickerRef}
        label="Appearance"
        value={getTheme()}
        size="s"
      >
        <sp-menu-item value="system">System</sp-menu-item>
        <sp-menu-item value="light">Light</sp-menu-item>
        <sp-menu-item value="dark">Dark</sp-menu-item>
      </sp-picker>
    </header>
  );
}
