
import { z } from "zod";

export const ColumnMetadataSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string(),
  type: z.enum(["numeric", "categorical", "date"]),
  nullCount: z.number().int().nonnegative(),
  distinctCount: z.number().int().nonnegative().optional(),
});

export const DatasetMetadataSchema = z.object({
  dataset: z.string(),
  rowCount: z.number().int().positive(),
  columns: z.array(ColumnMetadataSchema),
});

export const ChartSchema = z.object({
  chartTypeId: z.number().int().min(1).max(6),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative().nullable(),
  aggregation: z.enum(["sum", "avg", "min", "max", "count"]).nullable(),
  score: z.number().min(0).max(1),
}).strict();

export const ChartPlanSchema = z.object({
  charts: z.array(ChartSchema).max(20),
}).strict();

export type DatasetMetadata = z.infer<typeof DatasetMetadataSchema>;
export type Chart = z.infer<typeof ChartSchema>;
export type ChartPlan = z.infer<typeof ChartPlanSchema>;

export interface ValidationResult {
  charts: Chart[];
  rejected: number;
}

export function validateChartPlan(
  response: unknown,
  metadata: DatasetMetadata,
): ValidationResult {
  const parsed = ChartPlanSchema.parse(response);
  const columns = new Map(
    metadata.columns.map((column) => [column.id, column]),
  );

  const accepted: Chart[] = [];
  const signatures = new Set<string>();
  let rejected = 0;

  for (const chart of parsed.charts) {
    const x = columns.get(chart.x);
    const y = chart.y === null
      ? undefined
      : columns.get(chart.y);

    let valid = Boolean(x);

    if (x) {
      switch (chart.chartTypeId) {
        case 1: // Bar
          valid =
            x.type === "categorical" &&
            y?.type === "numeric" &&
            chart.aggregation !== null;
          break;

        case 2: // Line
          valid =
            x.type === "date" &&
            (x.distinctCount === undefined ||
              x.distinctCount >= 2) &&
            y?.type === "numeric" &&
            chart.aggregation !== null;
          break;

        case 3: // Scatter
          valid =
            x.type === "numeric" &&
            y?.type === "numeric" &&
            chart.x !== chart.y &&
            chart.aggregation === null;
          break;

        case 4: // Histogram
          valid =
            x.type === "numeric" &&
            chart.y === null &&
            chart.aggregation === null;
          break;

        case 5: // Boxplot
          valid =
            x.type === "categorical" &&
            y?.type === "numeric" &&
            chart.aggregation === null;
          break;

        case 6: // Heatmap
          valid =
            x.type === "categorical" &&
            y?.type === "categorical" &&
            chart.x !== chart.y &&
            chart.aggregation === "count";
          break;
      }

      if (x.distinctCount === 1) {
        valid = false;
      }
    }

    if (y?.distinctCount === 1) {
      valid = false;
    }

    const signature = JSON.stringify([
      chart.chartTypeId,
      chart.x,
      chart.y,
      chart.aggregation,
    ]);

    if (!valid || signatures.has(signature)) {
      rejected++;
      continue;
    }

    signatures.add(signature);
    accepted.push(chart);
  }

  accepted.sort((a, b) => b.score - a.score);

  return {
    charts: accepted,
    rejected,
  };
}
