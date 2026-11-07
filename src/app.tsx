
import { useEffect } from 'preact/hooks';
import { Header } from './components/Header';

import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/theme-light.js';
import '@spectrum-web-components/theme/theme-dark.js';
import '@spectrum-web-components/theme/scale-medium.js';

export function App() {
  useEffect(() => {
    const root = document.documentElement;
    const spectrum = document.querySelector('sp-theme');

    if (!spectrum) return;

    const syncTheme = () => {
      const color = root.dataset.theme === 'dark' ? 'dark' : 'light';
      spectrum.setAttribute('color', color);
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <sp-theme
      system="spectrum"
      color={document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'}
      scale="medium"
      class="block min-h-screen"
    >
      <div class="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Header />

        <main class="mx-auto w-full max-w-7xl px-6 py-12">
          <h1 class="text-3xl font-semibold tracking-tight">
            Explore your data
          </h1>

          <p class="mt-2 text-zinc-500 dark:text-zinc-400">
            Upload a dataset to start exploring and visualizing your data.
          </p>
        </main>
      </div>
    </sp-theme>
  );
}
