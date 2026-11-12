
import { useEffect, useRef, useState } from "preact/hooks";
import type { EChartsCoreOption } from "echarts/core";

import { Header } from "./components/Header";
import { FileUpload } from "./components/FileUpload";
import { ChartView } from "./components/ChartView";

import {
  loadDataset,
  type DatasetInfo,
} from "./features/database/dataset";

import {
  profileDataset,
  type DatasetProfile,
} from "./features/analysis/profiler";

import { createAnalysisPlan } from "./features/ai/planner";
import { subscribeModelProgress } from "./features/ai/model";
import type { Chart, ChartPlan } from "./features/ai/plan";

import { executeChartQuery } from "./features/analysis/query";
import { createChartOption } from "./features/analysis/chartOptions";

interface RenderedChart {
  chart: Chart;
  option: EChartsCoreOption;
}

interface ModelProgress {
  progress: number;
  text: string;
}

const CHART_NAMES: Record<number, string> = {
  1: "Bar chart",
  2: "Line chart",
  3: "Scatter plot",
  4: "Histogram",
  5: "Box plot",
  6: "Heatmap",
};

function getChartTitle(
  chart: Chart,
  dataset: DatasetInfo,
): string {
  const x = dataset.columns[chart.x]?.name ?? "Unknown";
  const y =
    chart.y === null
      ? null
      : dataset.columns[chart.y]?.name ?? "Unknown";

  switch (chart.chartTypeId) {
    case 1:
    case 2:
      return `${chart.aggregation ?? "Value"} ${y} by ${x}`;

    case 3:
      return `${x} vs ${y}`;

    case 4:
      return `Distribution of ${x}`;

    case 5:
      return `${y} by ${x}`;

    case 6:
      return `${x} × ${y}`;

    default:
      return "Data visualization";
  }
}

export function App() {
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [plan, setPlan] = useState<ChartPlan | null>(null);

  const [charts, setCharts] = useState<RenderedChart[]>([]);
  const [chartErrors, setChartErrors] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [completed, setCompleted] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const [modelProgress, setModelProgress] =
    useState<ModelProgress>({
      progress: 0,
      text: "Preparing model...",
    });

  const requestId = useRef(0);

  useEffect(() => {
    return subscribeModelProgress((report) => {
      setModelProgress({
        progress: Math.min(
          1,
          Math.max(0, report.progress),
        ),
        text: report.text,
      });
    });
  }, []);

  async function handleFileSelected(file: File) {
    if (loading || generating) return;

    const currentRequest = ++requestId.current;

    setLoading(true);
    setError(null);
    setDataset(null);
    setProfile(null);
    setPlan(null);
    setCharts([]);
    setChartErrors([]);
    setCompleted(0);

    try {
      const result = await loadDataset(file);
      const statistics = await profileDataset(result);

      if (currentRequest !== requestId.current) return;

      setDataset(result);
      setProfile(statistics);
    } catch (err) {
      if (currentRequest !== requestId.current) return;

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dataset.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAnalyses() {
    if (!dataset || !profile || generating || loading) {
      return;
    }

    const currentRequest = requestId.current;

    setGenerating(true);
    setError(null);
    setPlan(null);
    setCharts([]);
    setChartErrors([]);
    setCompleted(0);

    try {
      const generatedPlan = await createAnalysisPlan(
        dataset,
        profile,
      );

      if (currentRequest !== requestId.current) return;

      setPlan(generatedPlan);

      for (const chart of generatedPlan.charts) {
        if (currentRequest !== requestId.current) return;

        try {
          const data = await executeChartQuery(dataset, chart);

          const option = createChartOption(
            chart,
            data,
            dataset,
          );

          if (currentRequest !== requestId.current) return;

          setCharts((previous) => [
            ...previous,
            { chart, option },
          ]);
        } catch (err) {
          if (currentRequest !== requestId.current) return;

          const message =
            err instanceof Error
              ? err.message
              : "Unknown chart error";

          console.error("Chart query failed:", chart, err);

          setChartErrors((previous) => [
            ...previous,
            `${getChartTitle(chart, dataset)}: ${message}`,
          ]);
        } finally {
          if (currentRequest === requestId.current) {
            setCompleted((previous) => previous + 1);
          }
        }
      }
    } catch (err) {
      if (currentRequest !== requestId.current) return;

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate analyses.",
      );
    } finally {
      setGenerating(false);
    }
  }

  const progressPercent = Math.round(
    modelProgress.progress * 100,
  );

  return (
    <div class="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Header />

      <main class="mx-auto w-full max-w-7xl px-6 py-12">
        <h1 class="text-3xl font-semibold tracking-tight">
          Explore your data
        </h1>

        <p class="mt-2 mb-8 text-zinc-500 dark:text-zinc-400">
          Upload a CSV file and discover useful visualizations
          with a local AI model.
        </p>

        <FileUpload onFileSelected={handleFileSelected} />

        {loading && (
          <p role="status" class="mt-6 text-sm">
            Loading and profiling dataset...
          </p>
        )}

        {error && (
          <p
            role="alert"
            class="mt-6 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}

        {dataset && (
          <section class="mt-10">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 class="text-xl font-semibold">
                  {dataset.name}
                </h2>

                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {dataset.rowCount.toLocaleString()} rows ·{" "}
                  {dataset.columns.length} columns
                </p>
              </div>

              {profile && (
                <button
                  type="button"
                  disabled={generating || loading}
                  onClick={handleGenerateAnalyses}
                  class="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating
                    ? "Generating..."
                    : "Generate analyses"}
                </button>
              )}
            </div>

            <details class="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <summary class="cursor-pointer p-4 text-sm font-medium">
                Dataset columns and statistics
              </summary>

              <div class="overflow-x-auto px-4 pb-4">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="border-b border-zinc-200 dark:border-zinc-800">
                      <th class="px-3 py-2">Column</th>
                      <th class="px-3 py-2">Type</th>
                      <th class="px-3 py-2">Nulls</th>
                      <th class="px-3 py-2">Distinct</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dataset.columns.map((column) => {
                      const stats = profile?.columns.find(
                        (item) => item.name === column.name,
                      );

                      return (
                        <tr
                          key={column.name}
                          class="border-b border-zinc-100 dark:border-zinc-800"
                        >
                          <td class="px-3 py-2">{column.name}</td>
                          <td class="px-3 py-2 font-mono text-xs">
                            {column.type}
                          </td>
                          <td class="px-3 py-2">
                            {stats?.nullCount ?? "—"}
                          </td>
                          <td class="px-3 py-2">
                            {stats?.distinctCount ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        )}

        {generating && (
          <section
            class="mt-8 max-w-xl"
            role="status"
            aria-live="polite"
          >
            {!plan ? (
              <>
                <div class="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span class="font-medium">
                    Loading AI model
                  </span>

                  <span class="font-medium tabular-nums">
                    {progressPercent}%
                  </span>
                </div>

                <progress
                  value={modelProgress.progress}
                  max={1}
                  aria-label="Model loading progress"
                  class="h-3 w-full accent-blue-600"
                />

                <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {modelProgress.text}
                </p>

                {modelProgress.progress >= 1 && (
                  <p class="mt-2 text-sm">
                    Generating chart recommendations...
                  </p>
                )}
              </>
            ) : (
              <p class="text-sm font-medium">
                Rendering charts: {completed} /{" "}
                {plan.charts.length}
              </p>
            )}
          </section>
        )}

        {plan && (
          <section class="mt-10">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <h2 class="text-xl font-semibold">
                AI-generated visualizations
              </h2>

              <span class="text-sm text-zinc-500 dark:text-zinc-400">
                {charts.length} rendered ·{" "}
                {plan.charts.length} recommended
              </span>
            </div>

            {plan.charts.length === 0 && (
              <p class="mt-4 text-sm text-zinc-500">
                No suitable charts were recommended.
              </p>
            )}

            <div class="mt-6 grid gap-6 lg:grid-cols-2">
              {charts.map(({ chart, option }, index) => (
                <article
                  key={`${chart.chartTypeId}-${chart.x}-${chart.y}-${index}`}
                  class="min-w-0 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
                >
                  <div class="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <h3 class="font-semibold">
                        {getChartTitle(chart, dataset!)}
                      </h3>

                      <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {CHART_NAMES[chart.chartTypeId]}
                      </p>
                    </div>

                    <span class="shrink-0 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                      Score {chart.score.toFixed(2)}
                    </span>
                  </div>

                  <ChartView
                    option={option}
                    height={360}
                  />
                </article>
              ))}
            </div>

            {chartErrors.length > 0 && (
              <details class="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <summary class="cursor-pointer text-sm font-medium">
                  {chartErrors.length} chart(s) could not be rendered
                </summary>

                <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-red-600 dark:text-red-400">
                  {chartErrors.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </details>
            )}

            <details class="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <summary class="cursor-pointer p-4 text-sm font-medium">
                Inspect AI-generated JSON
              </summary>

              <pre class="overflow-x-auto p-4 text-xs">
                {JSON.stringify(plan, null, 2)}
              </pre>
            </details>
          </section>
        )}
      </main>
    </div>
  );
}
