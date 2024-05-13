import {
  DistanceStrategy,
  PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import "dotenv/config";
// import { JSONLoader } from "langchain/document_loaders/fs/json";
import { CharacterTextSplitter } from "langchain/text_splitter";
import fs from "node:fs";
import { PoolConfig } from "pg";
import { pgClientConfig } from "./pgvector.js";

// First, follow set-up instructions at
// https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/pgvector

const config = {
  postgresConnectionOptions: {
    type: "postgres",
    ...pgClientConfig,
  } as PoolConfig,
  tableName: "langchain_documents",
  columns: {
    idColumnName: "id",
    vectorColumnName: "vector",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
  // supported distance strategies: cosine (default), innerProduct, or euclidean
  distanceStrategy: "cosine" as DistanceStrategy,
};

const formatDocumentsAsString = (documents: Document[]): string =>
  documents.map((doc) => doc.pageContent).join("\n\n");

const pgvectorStore = await PGVectorStore.initialize(
  new OpenAIEmbeddings({
    apiKey: process.env["OPENAI_API_KEY"]!,
  }),
  config,
);

const splitter = new CharacterTextSplitter({
  chunkSize: 1536,
  chunkOverlap: 200,
});

async function main() {
  // TODO: 投入したいデータをここに入れてください
  for (const fn of ["data/colla-info.json"]) {
    // const loader = new JSONLoader(fn, ["/content"]);
    // const docs = await loader.load();
    const docs = JSON.parse(fs.readFileSync(fn, "utf-8"));
    for (const doc of docs) {
      const chunked = await splitter.createDocuments([doc["content"]], [], {
        chunkHeader: `TITLE: ${doc["title"]}\n\n---\n\n`,
        appendChunkOverlapHeader: true,
      });
      await pgvectorStore.addDocuments(chunked);
    }
  }

  // TODO: 検索クエリを更新してください
  const query = "シャッフル機能について";
  const results = await pgvectorStore.similaritySearch(query, 1);

  console.log(results);

  const retriever = pgvectorStore.asRetriever();

  const prompt =
    PromptTemplate.fromTemplate(`Answer the question based only on the following context:
{context}

Question: {question}`);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    new ChatOpenAI({
      apiKey: process.env["OPENAI_API_KEY"]!,
    }),
    new StringOutputParser(),
  ]);

  // TODO: 質問を更新してください
  const question = "Collaのシャッフル機能について教えて";
  const result = await chain.invoke(question);

  console.log(`\
質問: ${question}
回答: ${result}`);

  await pgvectorStore.end();
}

await main();
