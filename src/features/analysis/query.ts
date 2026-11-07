
import { getDatabase } from "../database/duckdb";
import type { DatasetInfo } from "../database/dataset"

export type Aggregation = "sum" | "avg" | "min" | "max" | "count";

export interface ComparisonQuery {
  dimension: string;
  metric: string;
  aggregation: Aggregation;
  limit?: number;
}

export interface ComparisonResult {
  label: string;
  value: number;
}

const NUMERIC_TYPES =
  /^(U?TINYINT|U?SMALLINT|U?INTEGER|U?BIGINT|UHUGEINT|HUGEINT|FLOAT|DOUBLE|REAL|DECIMAL)/;

const AGGREGATIONS: Record<Aggregation, string> = {
  sum: "SUM",
  avg: "AVG",
  min: "MIN",
  max: "MAX",
  count: "COUNT",
};

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export async function queryComparison(
  dataset: DatasetInfo,
  query: ComparisonQuery,
): Promise<ComparisonResult[]> {
  const dimension = dataset.columns.find(
    (column) => column.name === query.dimension,
  );

  const metric = dataset.columns.find(
    (column) => column.name === query.metric,
  );

  if (!dimension || !metric) {
    throw new Error("Unknown dataset column.");
  }

  if (
    query.aggregation !== "count" &&
    !NUMERIC_TYPES.test(metric.type.toUpperCase())
  ) {
    throw new Error("The selected metric must be numeric.");
  }

  const aggregate = AGGREGATIONS[query.aggregation];

  if (!aggregate) {
    throw new Error("Unsupported aggregation.");
  }

  const limit = Math.min(
    Math.max(Math.trunc(query.limit ?? 12), 1),
    50,
  );

  const dimensionName = quoteIdentifier(dimension.name);
  const metricName = quoteIdentifier(metric.name);

  const db = await getDatabase();
  const connection = await db.connect();

  try {
    const result = await connection.query(`
      SELECT
        CAST(${dimensionName} AS VARCHAR) AS label,
        ${aggregate}(${metricName}) AS value
      FROM dataset
      WHERE ${dimensionName} IS NOT NULL
      GROUP BY ${dimensionName}
      HAVING value IS NOT NULL
      ORDER BY value DESC NULLS LAST
      LIMIT ${limit}
    `);

    return result.toArray().map((row) => ({
      label: String(row.label),
      value: Number(row.value),
    }));
  } finally {
    await connection.close();
  }
}
