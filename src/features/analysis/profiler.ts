import { getDatabase } from "../database/duckdb";
import type { DatasetInfo } from "../database/dataset";

export interface ColumnProfile {
  name: string;
  type: string;
  nullCount: number;
  distinctCount: number;
  minimum?: number;
  maximum?: number;
  mean?: number;
  topValues?: {
    value: string;
    count: number;
  }[];
  earliest?: string;
  latest?: string;
}

export interface DatasetProfile {
  rowCount: number;
  columns: ColumnProfile[];
}

const NUMERIC_TYPES =
  /^(U?TINYINT|U?SMALLINT|U?INTEGER|U?BIGINT|UHUGEINT|HUGEINT|FLOAT|DOUBLE|REAL|DECIMAL)/;

const DATE_TYPES = /^(DATE|TIMESTAMP|TIME)/;

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function toNumber(value: unknown): number {
  return Number(value);
}

function formatTemporalValue(value: unknown, type: string): string {
  if (value instanceof Date) {
    const iso = value.toISOString();

    if (type === "DATE") {
      return iso.slice(0, 10);
    }

    if (type === "TIME") {
      return iso.slice(11, 23);
    }

    return iso;
  }

  return String(value);
}

export async function profileDataset(
  dataset: DatasetInfo,
): Promise<DatasetProfile> {
  const db = await getDatabase();
  const connection = await db.connect();

  try {
    const columns: ColumnProfile[] = [];

    for (const column of dataset.columns) {
      const name = quoteIdentifier(column.name);
      const type = column.type.toUpperCase();

      const isNumeric = NUMERIC_TYPES.test(type);
      const isDate = DATE_TYPES.test(type);

      const statistics = await connection.query(`
        SELECT
          COUNT(*) - COUNT(${name}) AS null_count,
          APPROX_COUNT_DISTINCT(${name}) AS distinct_count
          ${
            isNumeric
              ? `,
                MIN(${name}) AS minimum,
                MAX(${name}) AS maximum,
                AVG(${name}) AS mean`
              : ""
          }
          ${
            isDate
              ? `,
                MIN(${name}) AS earliest,
                MAX(${name}) AS latest`
              : ""
          }
        FROM dataset
      `);

      const row = statistics.toArray()[0];

      const nullCount = toNumber(row.null_count);

      const profile: ColumnProfile = {
        name: column.name,
        type: column.type,
        nullCount,
        distinctCount: Math.min(
          toNumber(row.distinct_count),
          dataset.rowCount - nullCount,
        ),
      };

      if (isNumeric) {
        if (row.minimum != null) {
          profile.minimum = toNumber(row.minimum);
        }

        if (row.maximum != null) {
          profile.maximum = toNumber(row.maximum);
        }

        if (row.mean != null) {
          profile.mean = toNumber(row.mean);
        }
      }

      if (isDate) {
        if (row.earliest != null) {
          profile.earliest = formatTemporalValue(row.earliest, type);
        }

        if (row.latest != null) {
          profile.latest = formatTemporalValue(row.latest, type);
        }
      }

      if (/^(VARCHAR|BOOLEAN)$/.test(type)) {
        const frequencies = await connection.query(`
          SELECT
            CAST(${name} AS VARCHAR) AS value,
            COUNT(*) AS frequency
          FROM dataset
          WHERE ${name} IS NOT NULL
          GROUP BY ${name}
          ORDER BY frequency DESC, value
          LIMIT 5
        `);

        profile.topValues = frequencies.toArray().map((item) => ({
          value: String(item.value),
          count: toNumber(item.frequency),
        }));
      }

      columns.push(profile);
    }

    return {
      rowCount: dataset.rowCount,
      columns,
    };
  } finally {
    await connection.close();
  }
}
