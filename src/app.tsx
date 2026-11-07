
import { useState } from 'preact/hooks';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';

export function App() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div class="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Header />

      <main class="mx-auto w-full max-w-7xl px-6 py-12">
        <h1 class="text-3xl font-semibold tracking-tight">
          Explore your data
        </h1>

        <p class="mt-2 mb-8 text-zinc-500 dark:text-zinc-400">
          Upload a dataset to start exploring and visualizing your data.
        </p>

        <FileUpload onFileSelected={setFile} />

        {file && (
          <section class="mt-8 max-w-2xl border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <h2 class="text-lg font-semibold">Selected dataset</h2>

            <dl class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-sm text-zinc-500 dark:text-zinc-400">
                  Filename
                </dt>
                <dd class="mt-1 break-all font-medium">
                  {file.name}
                </dd>
              </div>

              <div>
                <dt class="text-sm text-zinc-500 dark:text-zinc-400">
                  File size
                </dt>
                <dd class="mt-1 font-medium">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </dd>
              </div>
            </dl>
          </section>
        )}
      </main>
    </div>
  );
}
