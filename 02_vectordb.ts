import "dotenv/config";
import fs from "node:fs";
import { OpenAI } from "openai";
import pgvector from "pgvector/pg";
import {
  createTableIfNotExists,
  getClientWithScope,
  tableName,
} from "./pgvector.js";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const model = "text-embedding-3-small";

async function main() {
  await createTableIfNotExists();

  const { client } = await getClientWithScope();

  const queryOnly = false;
  if (!queryOnly) {
    // データを挿入
    // TODO: 投入したいデータをここに入れてください
    const contents: string[] = [];

    const json = JSON.parse(fs.readFileSync("data/colla-info.json", "utf-8"));
    for (const row of json) {
      contents.push(`\
Title: ${row["title"]}
Content:
${row["content"]}`);
    }

    for (const content of contents) {
      const input = content.replace(/\n/g, " ");

      const response = await openai.embeddings.create({
        model,
        input,
      });

      const { embedding } = response.data[0]!;
      // console.log(embedding);

      await client.query(
        `INSERT INTO "${tableName}" (content, vector) VALUES ($1, $2)`,
        [input, pgvector.toSql(embedding)],
      );
    }
  }

  // データを検索
  // TODO: 検索したいクエリをここに入れてください
  const query = "Collaの機能について";
  const response = await openai.embeddings.create({
    model,
    input: query.replace(/\n/g, " "),
  });
  const { embedding } = response.data[0]!;
  // console.log(embedding);

  // refs: https://www.sraoss.co.jp/tech-blog/pgsql/pgvector-intro/
  const queryResult = await client.query(
    `SELECT * FROM "${tableName}" ORDER BY vector <=> $1 LIMIT 5`,
    [pgvector.toSql(embedding)],
  );

  console.dir(queryResult.rows, { depth: null });
  client.end();
}

await main();
