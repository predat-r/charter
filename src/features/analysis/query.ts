
import { getDatabase } from "../database/duckdb";
import type { DatasetInfo } from "../database/dataset";
import type { Chart } from "../ai/plan";

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

export type ChartData =
  | {
      type: "bar" | "line" | "histogram";
      labels: string[];
      values: number[];
    }
  | {
      type: "scatter";
      points: [number, number][];
    }
  | {
      type: "boxplot";
      labels: string[];
      values: [number, number, number, number, number][];
    }
  | {
      type: "heatmap";
      xLabels: string[];
      yLabels: string[];
      values: [number, number, number][];
    };

const AGGREGATIONS: Record<Aggregation, string> = {
  sum: "SUM",
  avg: "AVG",
  min: "MIN",
  max: "MAX",
  count: "COUNT",
};

function quote(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function number(value: unknown): number {
  return Number(value);
}

function label(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value);
}

function getColumn(dataset: DatasetInfo, id: number): string {
  const column = dataset.columns[id];

  if (!column) {
    throw new Error(`Unknown column ID: ${id}`);
  }

  return quote(column.name);
}

function getAggregation(chart: Chart): string {
  if (!chart.aggregation) {
    throw new Error("Chart requires an aggregation.");
  }

  return AGGREGATIONS[chart.aggregation];
}

export async function executeChartQuery(
  dataset: DatasetInfo,
  chart: Chart,
): Promise<ChartData> {
  const db = await getDatabase();
  const connection = await db.connect();

  const x = getColumn(dataset, chart.x);
  const y = chart.y === null
    ? null
    : getColumn(dataset, chart.y);

  try {
    switch (chart.chartTypeId) {
      case 1:
      case 2: {
        if (!y) {
          throw new Error("Chart requires a Y column.");
        }

        const aggregation = getAggregation(chart);
        const limit = chart.chartTypeId === 1 ? 30 : 1000;

        const result = await connection.query(`
          SELECT
            ${x} AS dimension,
            ${aggregation}(${y}) AS value
          FROM dataset
          WHERE ${x} IS NOT NULL
            AND ${y} IS NOT NULL
          GROUP BY ${x}
          ORDER BY ${
            chart.chartTypeId === 2
              ? "dimension ASC"
              : "value DESC NULLS LAST"
          }
          LIMIT ${limit}
        `);

        const rows = result.toArray();

        return {
          type: chart.chartTypeId === 1 ? "bar" : "line",
          labels: rows.map((row) => label(row.dimension)),
          values: rows.map((row) => number(row.value)),
        };
      }

      case 3: {
        if (!y) {
          throw new Error("Scatter plot requires a Y column.");
        }

        const result = await connection.query(`
          SELECT ${x} AS x, ${y} AS y
          FROM dataset
          WHERE ${x} IS NOT NULL
            AND ${y} IS NOT NULL
          LIMIT 5000
        `);

        return {
          type: "scatter",
          points: result.toArray().map((row) => [
            number(row.x),
            number(row.y),
          ]),
        };
      }

      case 4: {
        const result = await connection.query(`
          WITH bounds AS (
            SELECT
              MIN(${x}) AS low,
              MAX(${x}) AS high
            FROM dataset
          ),
          bins AS (
            SELECT
              CASE
                WHEN high = low THEN 0
                ELSE LEAST(
                  19,
                  GREATEST(
                    0,
                    FLOOR(
                      (${x} - low) * 20.0 /
                      NULLIF(high - low, 0)
                    )
                  )
                )
              END AS bin
            FROM dataset
            CROSS JOIN bounds
            WHERE ${x} IS NOT NULL
          )
          SELECT
            bin,
            COUNT(*) AS frequency
          FROM bins
          GROUP BY bin
          ORDER BY bin
        `);

        const rows = result.toArray();
        const frequencies = new Map(
          rows.map((row) => [
            number(row.bin),
            number(row.frequency),
          ]),
        );

        return {
          type: "histogram",
          labels: Array.from(
            { length: 20 },
            (_, i) => `Bin ${i + 1}`,
          ),
          values: Array.from(
            { length: 20 },
            (_, i) => frequencies.get(i) ?? 0,
          ),
        };
      }

      case 5: {
        if (!y) {
          throw new Error("Boxplot requires a Y column.");
        }

        const result = await connection.query(`
          SELECT
            ${x} AS category,
            MIN(${y}) AS minimum,
            QUANTILE_CONT(${y}, 0.25) AS q1,
            MEDIAN(${y}) AS median,
            QUANTILE_CONT(${y}, 0.75) AS q3,
            MAX(${y}) AS maximum
          FROM dataset
          WHERE ${x} IS NOT NULL
            AND ${y} IS NOT NULL
          GROUP BY ${x}
          ORDER BY category
          LIMIT 30
        `);

        const rows = result.toArray();

        return {
          type: "boxplot",
          labels: rows.map((row) => label(row.category)),
          values: rows.map((row) => [
            number(row.minimum),
            number(row.q1),
            number(row.median),
            number(row.q3),
            number(row.maximum),
          ]),
        };
      }

      case 6: {
        if (!y) {
          throw new Error("Heatmap requires a Y column.");
        }

        const result = await connection.query(`
          SELECT
            ${x} AS x,
            ${y} AS y,
            COUNT(*) AS frequency
          FROM dataset
          WHERE ${x} IS NOT NULL
            AND ${y} IS NOT NULL
          GROUP BY ${x}, ${y}
          ORDER BY frequency DESC
          LIMIT 400
        `);

        const rows = result.toArray();

        const xLabels = [
          ...new Set(rows.map((row) => label(row.x))),
        ];

        const yLabels = [
          ...new Set(rows.map((row) => label(row.y))),
        ];

        return {
          type: "heatmap",
          xLabels,
          yLabels,
          values: rows.map((row) => [
            xLabels.indexOf(label(row.x)),
            yLabels.indexOf(label(row.y)),
            number(row.frequency),
          ]),
        };
      }

      default:
        throw new Error(
          `Unsupported chart type: ${chart.chartTypeId}`,
        );
    }
  } finally {
    await connection.close();
  }
}

// Retained for the temporary chart preview in app.tsx.
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

  const db = await getDatabase();
  const connection = await db.connect();

  try {
    const result = await connection.query(`
      SELECT
        CAST(${quote(dimension.name)} AS VARCHAR) AS label,
        ${AGGREGATIONS[query.aggregation]}(
          ${quote(metric.name)}
        ) AS value
      FROM dataset
      WHERE ${quote(dimension.name)} IS NOT NULL
      GROUP BY ${quote(dimension.name)}
      ORDER BY value DESC NULLS LAST
      LIMIT ${Math.min(
        Math.max(Math.trunc(query.limit ?? 10), 1),
        50,
      )}
    `);

    return result.toArray().map((row) => ({
      label: String(row.label),
      value: number(row.value),
    }));
  } finally {
    await connection.close();
  }
}
