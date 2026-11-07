import { useState } from "preact/hooks";
import { Header } from "./components/Header";
import { FileUpload } from "./components/FileUpload";
import { loadDataset, type DatasetInfo } from "./features/database/dataset";
import {
  profileDataset,
  type DatasetProfile,
} from "./features/analysis/profiler";
import { ChartView } from "./components/ChartView";
import { queryComparison } from "./features/analysis/query";
import type { EChartsCoreOption } from "echarts/core";

export function App() {
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [chartOption, setChartOption] = useState<EChartsCoreOption | null>(
    null,
  );
  async function handleFileSelected(file: File) {
    setLoading(true);
    setError(null);
    setDataset(null);
    setProfile(null);
    setChartOption(null);

    try {
      const result = await loadDataset(file);
      setDataset(result);

      const statistics = await profileDataset(result);
      setProfile(statistics);

      const dimension = result.columns.find(
        (column) => column.type === "VARCHAR",
      );

      const metric = result.columns.find((column) =>
        /^(INTEGER|BIGINT|FLOAT|DOUBLE|DECIMAL)/.test(column.type),
      );

      if (dimension && metric) {
        const data = await queryComparison(result, {
          dimension: dimension.name,
          metric: metric.name,
          aggregation: "avg",
          limit: 10,
        });

        setChartOption({
          tooltip: {
            trigger: "axis",
          },
          grid: {
            left: 60,
            right: 30,
            top: 30,
            bottom: 70,
          },
          xAxis: {
            type: "category",
            data: data.map((item) => item.label),
            axisLabel: {
              rotate: 35,
            },
          },
          yAxis: {
            type: "value",
          },
          series: [
            {
              type: "bar",
              name: `Average ${metric.name}`,
              data: data.map((item) => item.value),
            },
          ],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dataset.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Header />

      <main class="mx-auto w-full max-w-7xl px-6 py-12">
        <h1 class="text-3xl font-semibold tracking-tight">Explore your data</h1>

        <p class="mt-2 mb-8 text-zinc-500 dark:text-zinc-400">
          Upload a dataset to start exploring and visualizing your data.
        </p>

        <FileUpload onFileSelected={handleFileSelected} />
        {loading && (
          <p
            role="status"
            class="mt-6 text-sm text-zinc-500 dark:text-zinc-400"
          >
            Analyzing dataset...
          </p>
        )}

        {error && (
          <p role="alert" class="mt-6 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {dataset && (
          <section class="mt-8 max-w-2xl border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <h2 class="text-lg font-semibold">{dataset.name}</h2>

            <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {dataset.rowCount.toLocaleString()} rows ·{" "}
              {dataset.columns.length} columns
            </p>

            <div class="mt-6 overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-zinc-200 dark:border-zinc-800">
                    <th class="px-3 py-2 font-semibold">Column</th>
                    <th class="px-3 py-2 font-semibold">Data type</th>
                  </tr>
                </thead>

                <tbody>
                  {dataset.columns.map((column) => (
                    <tr
                      key={column.name}
                      class="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td class="px-3 py-2">{column.name}</td>
                      <td class="px-3 py-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {column.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {profile && (
          <section class="mt-8 max-w-2xl">
            <h2 class="mb-4 text-lg font-semibold">Statistical profile</h2>

            <pre class="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </section>
        )}
        {chartOption && (
          <section class="mt-8 max-w-4xl">
            <h2 class="mb-4 text-lg font-semibold">Data visualization</h2>

            <ChartView option={chartOption} />
          </section>
        )}
      </main>
    </div>
  );
}
