
import { z } from "zod";
import type { DatasetInfo } from "../database/dataset";

export const AnalysisSchema = z
  .object({
    type: z.literal("category_comparison"),
    title: z.string().min(1).max(100),
    dimension: z.string().min(1),
    metric: z.string().min(1),
    aggregation: z.enum(["sum", "avg", "min", "max", "count"]),
    chart: z.literal("bar"),
  })
  .strict();

export const AnalysisPlanSchema = z
  .object({
    analyses: z.array(AnalysisSchema).min(1).max(3),
  })
  .strict();

export type Analysis = z.infer<typeof AnalysisSchema>;
export type AnalysisPlan = z.infer<typeof AnalysisPlanSchema>;

const NUMERIC_TYPES =
  /^(U?TINYINT|U?SMALLINT|U?INTEGER|U?BIGINT|UHUGEINT|HUGEINT|FLOAT|DOUBLE|REAL|DECIMAL)/;

export function validateAnalysisPlan(
  input: unknown,
  dataset: DatasetInfo,
): AnalysisPlan {
  const plan = AnalysisPlanSchema.parse(input);

  const columns = new Map(
    dataset.columns.map((column) => [column.name, column]),
  );

  for (const analysis of plan.analyses) {
    const dimension = columns.get(analysis.dimension);
    const metric = columns.get(analysis.metric);

    if (!dimension || !metric) {
      const unknownColumns = [
        !dimension ? analysis.dimension : null,
        !metric ? analysis.metric : null,
      ].filter((name): name is string => name !== null);

      throw new Error(
        `Analysis "${analysis.title}" references unknown column(s): ` +
          unknownColumns.map((name) => `"${name}"`).join(", ") +
          `. Dimension="${analysis.dimension}", ` +
          `metric="${analysis.metric}".`,
      );
    }

    if (analysis.dimension === analysis.metric) {
      throw new Error(
        `Analysis "${analysis.title}" uses "${analysis.dimension}" ` +
          "as both dimension and metric.",
      );
    }

    if (
      analysis.aggregation !== "count" &&
      !NUMERIC_TYPES.test(metric.type.toUpperCase())
    ) {
      throw new Error(
        `Analysis "${analysis.title}" uses "${analysis.metric}" ` +
          `(${metric.type}) with aggregation "${analysis.aggregation}". ` +
          "The metric must be numeric.",
      );
    }
  }

  return plan;
}
