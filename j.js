import { config } from "dotenv";
config({ path: ".env.local" });

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
console.log("API key loaded:", apiKey ? "Yes" : "No");

if (!apiKey) {
  console.error("No OpenAI API key found");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API...");
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        { role: "user", content: "Say hello" },
      ],
      max_tokens: 100,
    });

    console.log("Success! Response:", completion.choices[0].message.content);
  } catch (error) {
    console.error("Error:", error);
    console.error("Status:", error.status);
    console.error("Code:", error.code);
    console.error("Message:", error.message);
  }
}

testOpenAI();