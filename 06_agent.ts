import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { z } from "zod";

// https://js.langchain.com/docs/modules/agents/quick_start

const prompt = await pull<ChatPromptTemplate>("hwchase17/openai-tools-agent");

const addTool = new DynamicStructuredTool({
  name: "add",
  description: "Add two integers together.",
  schema: z.object({
    firstInt: z.number(),
    secondInt: z.number(),
  }),
  func: async ({ firstInt, secondInt }) => {
    return (firstInt + secondInt).toString();
  },
});

const multiplyTool = new DynamicStructuredTool({
  name: "multiply",
  description: "Multiply two integers together.",
  schema: z.object({
    firstInt: z.number(),
    secondInt: z.number(),
  }),
  func: async ({ firstInt, secondInt }) => {
    return (firstInt * secondInt).toString();
  },
});

const exponentiateTool = new DynamicStructuredTool({
  name: "exponentiate",
  description: "Exponentiate the base to the exponent power.",
  schema: z.object({
    base: z.number(),
    exponent: z.number(),
  }),
  func: async ({ base, exponent }) => {
    return (base ** exponent).toString();
  },
});

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
  // verbose: true,
});

const tools = [addTool, multiplyTool, exponentiateTool];

const agent = await createOpenAIToolsAgent({
  llm: model,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true,
});

await agentExecutor.invoke({
  input:
    "Take 3 to the fifth power and multiply that by the sum of twelve and three, then square the whole result",
});
