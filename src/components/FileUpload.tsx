
import { useRef, useState } from 'preact/hooks';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
}

export function FileUpload({ onFileSelected }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectFile(file?: File) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are supported.');
      return;
    }

    setError(null);
    onFileSelected(file);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer?.files.length !== 1) {
      setError('Please select one file at a time.');
      return;
    }

    selectFile(event.dataTransfer.files[0]);
  }

  return (
    <section class="w-full max-w-2xl">
      <div
        class={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
            : 'border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
      >
        <h2 class="text-lg font-medium">Upload a dataset</h2>

        <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Drag and drop a CSV file here, or select one from your device.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          class="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Browse files
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          class="sr-only"
          aria-label="Select CSV file"
          onChange={(event) => {
            selectFile(event.currentTarget.files?.[0]);
            event.currentTarget.value = '';
          }}
        />

        <p class="mt-4 text-xs text-zinc-500">
          CSV only · Processed locally in your browser
        </p>
      </div>

      {error && (
        <p role="alert" class="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
