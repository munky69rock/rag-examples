# RAG example

## Step 0

```sh
npm i
cp .env.example .env
```

## Step 1

OpenAI APIをそのまま叩く

```sh
npx tsx ./01_chatgpt.ts -m 'YOUR PROMPT'
```

## Step 2

Vector DBを使ってみる

1. DBのセットアップ

```sh
echo password > db/password.txt
docker compose up
```

直接SQLなどを実行したい場合は以下

```sh
docker compose run --rm db psql -U postgres -d rag-example -h db
```

2. コードを更新してデータの投入と検索クエリの指定をしてください

```sh
vi ./02_vectordb.ts
```

3. コードを実行してください

```sh
npx tsx ./02_vectordb.ts
```

## Step 3

RAGを体験する

1. 必要に応じてプロンプトを設定する

```sh
vi ./03_simple_rag.ts
```

2. コードを実行

```sh
npx tsx ./03_simple_rag.ts
```

## Step 4

langchainでRAGを体験する

1. 必要に応じてプロンプトを設定する

```sh
vi ./04_langchain_rag.ts
```

2. コードを実行

```sh
npx tsx ./04_langchain_rag.ts
```

## Step 5

WIP: function callingを体験する

1. 以下を実行

```sh
npx tsx ./05_function_calling.ts
```

## Step 6

WIP: agentを体験する

1. 以下を実行

```sh
npx tsx ./06_agent.ts
```
