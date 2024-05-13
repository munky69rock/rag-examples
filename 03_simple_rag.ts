import "dotenv/config";
import { OpenAI } from "openai";
import pgvector from "pgvector/pg";
import { getClientWithScope, tableName } from "./pgvector.js";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

async function main() {
  const { client } = await getClientWithScope();

  // TODO: プロンプトを指定する
  const query = "Collaの機能について教えて";

  const embeddingsRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query.replace(/\n/g, " "),
  });
  const { embedding } = embeddingsRes.data[0]!;
  // console.log(embedding);

  // refs: https://www.sraoss.co.jp/tech-blog/pgsql/pgvector-intro/
  const queryResult = await client.query(
    `SELECT * FROM "${tableName}" ORDER BY vector <=> $1 LIMIT 3`,
    [pgvector.toSql(embedding)],
  );

  // refs: https://github.com/pinecone-io/chatbot-demo/blob/main/src/pages/api/templates.ts
  const prompt = `\
Answer the question based on the context below. You should follow ALL the following rules when generating and answer:
- There will be a CONTEXT, and a QUESTION.
- The final answer must always be styled using markdown.
- Your main goal is to point the user to the right source of information (the source is always a URL) based on the CONTEXT you are given.
- Your secondary goal is to provide the user with an answer that is relevant to the question.
- Based on the CONTEXT, choose the source that is most relevant to the QUESTION.
- Do not make up any answers if the CONTEXT does not have relevant information.
- Use bullet points, lists, paragraphs and text styling to present the answer in markdown.
- Do not mention the CONTEXT in the answer, but use them to generate the answer.
- The answer should only be based on the CONTEXT. Do not use any external sources. Do not generate the response based on the question without clear reference to the context.
- Summarize the CONTEXT to make it easier to read, but don't omit any information.
- It is IMPERATIVE that any link provided is found in the CONTEXT. Prefer not to provide a link if it is not found in the CONTEXT.

CONTEXT: ${queryResult.rows.map((row) => row.content).join("\n")}

QUESTION: ${query} 

Final Answer: `;

  // console.log(prompt);

  const completionsRes = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });
  const result = completionsRes.choices[0]!.message.content;
  console.log(result);
  await client.end();
}

await main();
