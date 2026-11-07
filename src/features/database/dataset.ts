
import {
  DuckDBDataProtocol,
  type AsyncDuckDBConnection,
} from '@duckdb/duckdb-wasm';

import { getDatabase } from './duckdb';

export interface DatasetColumn {
  name: string;
  type: string;
}

export interface DatasetInfo {
  name: string;
  rowCount: number;
  columns: DatasetColumn[];
}

const TABLE_NAME = 'dataset';

export async function loadDataset(file: File): Promise<DatasetInfo> {
  const db = await getDatabase();
  const connection = await db.connect();
  const filePath = `${crypto.randomUUID()}.csv`;

  try {
    await db.registerFileHandle(
      filePath,
      file,
      DuckDBDataProtocol.BROWSER_FILEREADER,
      true
    );

    await connection.query(`DROP TABLE IF EXISTS ${TABLE_NAME}`);

    await connection.insertCSVFromPath(filePath, {
      schema: 'main',
      name: TABLE_NAME,
      detect: true,
      header: true,
    });

    return await getDatasetInfo(connection, file.name);
  } finally {
    await db.dropFile(filePath).catch(() => {});
    await connection.close();
  }
}

async function getDatasetInfo(
  connection: AsyncDuckDBConnection,
  filename: string
): Promise<DatasetInfo> {
  const schema = await connection.query(
    `DESCRIBE SELECT * FROM ${TABLE_NAME}`
  );

  const count = await connection.query(
    `SELECT COUNT(*) AS total FROM ${TABLE_NAME}`
  );

  const columns: DatasetColumn[] = schema.toArray().map((column) => ({
    name: String(column.column_name),
    type: String(column.column_type),
  }));

  const rowCount = Number(count.toArray()[0].total);

  return {
    name: filename,
    rowCount,
    columns,
  };
}
