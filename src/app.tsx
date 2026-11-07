
import { Header } from './components/Header';

export function App() {
  return (
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
  );
}
