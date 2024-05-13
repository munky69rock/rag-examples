import fs from "node:fs";
import pg from "pg";
import pgvector from "pgvector/pg";

export const pgClientConfig = {
  host: "localhost",
  port: 5432,
  database: "rag-example",
  user: "postgres",
  password: fs.readFileSync("db/password.txt", "utf-8").trim(),
} as const;

let client: pg.Client;
export const getClient = async () => {
  if (!client) {
    client = new pg.Client(pgClientConfig);
    await client.connect();
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    await pgvector.registerType(client);
  }
  return client;
};

export const getClientWithScope = async () => {
  const client = await getClient();
  return {
    client,
    [Symbol.asyncDispose]: async () => client.end(),
  };
};

export const tableName = "documents";

export const createTableIfNotExists = async () => {
  const client = await getClient();
  await client.query(`
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      vector VECTOR(1536) NOT NULL
    );
  `);
};

export const dropTable = async () => {
  const client = await getClient();
  await client.query(`
    DROP TABLE IF EXISTS "${tableName}";
  `);
};
