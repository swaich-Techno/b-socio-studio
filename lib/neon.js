import { neon } from "@neondatabase/serverless";

const TABLE_NAME = "b_socio_records";

let sqlClient;
let readyPromise;

function databaseUrl() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL environment variable for Neon.");
  }
  return url;
}

export function getSql() {
  if (!sqlClient) {
    sqlClient = neon(databaseUrl());
  }
  return sqlClient;
}

export async function ensureDatabase() {
  if (!readyPromise) {
    const sql = getSql();
    readyPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS b_socio_records (
          collection text NOT NULL,
          id text NOT NULL,
          data jsonb NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (collection, id)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS b_socio_records_collection_idx ON b_socio_records (collection)`;
      await sql`CREATE INDEX IF NOT EXISTS b_socio_records_data_gin_idx ON b_socio_records USING gin (data)`;
    })();
  }
  await readyPromise;
  return getSql();
}

export { TABLE_NAME };

export default ensureDatabase;
