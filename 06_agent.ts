import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
  dangerouslyAllowBrowser: true,
});

async function getLocation() {
  const response = await fetch("https://ipapi.co/json/");
  const locationData = await response.json();
  return locationData;
}

async function getCurrentWeather(latitude: string, longitude: string) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=apparent_temperature`;
  const response = await fetch(url);
  const weatherData = await response.json();
  return weatherData;
}

const tools: Array<ChatCompletionTool> = [
  {
    type: "function",
    function: {
      name: "getCurrentWeather",
      description: "Get the current weather in a given location",
      parameters: {
        type: "object",
        properties: {
          latitude: {
            type: "string",
          },
          longitude: {
            type: "string",
          },
        },
        required: ["longitude", "latitude"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getLocation",
      description: "Get the user's location based on their IP address",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

const availableTools = {
  getCurrentWeather,
  getLocation,
};

const messages: Array<ChatCompletionMessageParam> = [
  {
    role: "system",
    content: `You are a helpful assistant. Only use the functions you have been provided with.`,
  },
];

async function agent(userInput: string) {
  messages.push({
    role: "user",
    content: userInput,
  });

  for (let i = 0; i < 5; i++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools,
    });

    // console.debug(`-- [${i}] response:`, response.choices[0]!.message);

    const { finish_reason, message } = response.choices[0]!;

    if (finish_reason === "tool_calls" && message.tool_calls) {
      const functionName = message.tool_calls[0]!.function
        .name as keyof typeof availableTools;
      const functionToCall = availableTools[functionName];
      const functionArgs = JSON.parse(
        message.tool_calls[0]!.function.arguments,
      );
      const functionArgsArr = Object.values(functionArgs) as [string, string];
      const functionResponse = await functionToCall(...functionArgsArr);

      messages.push({
        role: "function",
        name: functionName,
        content: `
                The result of the last function was this: ${JSON.stringify(
                  functionResponse,
                )}
                `,
      });
    } else if (finish_reason === "stop") {
      messages.push(message);
      return message.content;
    }
  }
  return "The maximum number of iterations has been met without a suitable answer. Please try again with a more specific input.";
}

const response = await agent(
  "Please suggest some activities based on my location and the weather.",
);

console.log("response:", response);

// console.log("total messages:", messages);
