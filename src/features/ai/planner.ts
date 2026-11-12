
import { z } from "zod";

import type { DatasetInfo } from "../database/dataset";
import type { DatasetProfile } from "../analysis/profiler";

import { generateJSON } from "./model";
import {
  ChartPlanSchema,
  validateChartPlan,
  type ChartPlan,
  type DatasetMetadata,
} from "./plan";

const SYSTEM_PROMPT = `
You are Charter's data visualization planner.

Given a dataset's column names, types, and statistics,
recommend useful charts for exploring the data.

Return JSON with this structure:
{
  "charts": [
    {
      "chartTypeId": 4,
      "x": 2,
      "y": null,
      "aggregation": null,
      "score": 0.9
    }
  ]
}

Chart types:
1 = Bar: categorical X, numeric Y, aggregation
2 = Line: date X, numeric Y, aggregation
3 = Scatter: numeric X, numeric Y, no aggregation
4 = Histogram: numeric X, Y null, no aggregation
5 = Boxplot: categorical X, numeric Y, no aggregation
6 = Heatmap: categorical X, categorical Y, count

Instructions:
- Recommend up to 8 useful charts.
- Use column IDs, not column names, in the output.
- Choose charts that help understand distributions,
  relationships, trends, or group differences.
- Prefer columns with meaningful variation.
- Avoid identifiers, constant columns, and excessive missing data.
- Use average rather than sum for nonadditive measurements.
- Never invent columns or data findings.
- Rank charts by usefulness, highest score first.
- Return an empty charts array only if no valid chart is possible.

Return JSON only.
`;

const NUMERIC_TYPE =
  /^(U?TINYINT|U?SMALLINT|U?INTEGER|U?BIGINT|UHUGEINT|HUGEINT|FLOAT|DOUBLE|REAL|DECIMAL)/;

const DATE_TYPE =
  /^(DATE|TIMESTAMP|TIMESTAMPTZ|TIMESTAMP_S|TIMESTAMP_MS|TIMESTAMP_NS)$/;

function normalizeType(
  type: string,
): "numeric" | "categorical" | "date" {
  const normalized = type.toUpperCase();

  if (DATE_TYPE.test(normalized)) {
    return "date";
  }

  if (NUMERIC_TYPE.test(normalized)) {
    return "numeric";
  }

  return "categorical";
}

export function createDatasetMetadata(
  dataset: DatasetInfo,
  profile: DatasetProfile,
): DatasetMetadata {
  const profiles = new Map(
    profile.columns.map((column) => [
      column.name,
      column,
    ]),
  );

  return {
    dataset: dataset.name,
    rowCount: dataset.rowCount,
    columns: dataset.columns.map((column, id) => {
      const statistics = profiles.get(column.name);

      return {
        id,
        name: column.name,
        type: normalizeType(column.type),
        nullCount: statistics?.nullCount ?? 0,
        ...(statistics?.distinctCount !== undefined && {
          distinctCount: statistics.distinctCount,
        }),
      };
    }),
  };
}

export async function createAnalysisPlan(
  dataset: DatasetInfo,
  profile: DatasetProfile,
): Promise<ChartPlan> {
  const metadata = createDatasetMetadata(
    dataset,
    profile,
  );

  const userPrompt =
    "Generate and rank useful charts for this dataset metadata. " +
    "Return JSON only.\n" +
    JSON.stringify(metadata);

  const schema = JSON.stringify(
    z.toJSONSchema(ChartPlanSchema),
  );

  const response = await generateJSON(
    SYSTEM_PROMPT,
    userPrompt,
    schema,
  );
  console.log("RAW AI RESPONSE:", response);

  const result = validateChartPlan(
    response,
    metadata,
  );

  if (import.meta.env.DEV) {
    console.log("Charter metadata:", metadata);
    console.log("Validated charts:", result.charts);
    console.log("Rejected charts:", result.rejected);
  }

  return {
    charts: result.charts,
  };
}
