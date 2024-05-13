import "dotenv/config";
import { OpenAI } from "openai";
import readline from "readline";

const openai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"]! });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string) {
  return new Promise<string>((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const input = await askQuestion("質問: ");

    messages.push({ role: "user", content: input });
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      stream: true,
    });
    let answer = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      answer += delta;
      process.stdout.write(delta);
    }
    messages.push({ role: "assistant", content: answer });

    console.log("\n");

    const confirmContinue = await askQuestion("続けますか？ (y/n): ");
    if (confirmContinue.toLowerCase() !== "y") {
      break;
    }
  }

  rl.close();
}

await main();
