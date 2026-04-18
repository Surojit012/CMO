import Groq from "groq-sdk";

const FIREWORKS_MODEL = "accounts/fireworks/models/llama-v3p3-70b-instruct";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callFireworks(
  systemPrompt: string,
  userPrompt: string,
  options: { maxTokens?: number; temperature?: number; responseFormat?: any } = {}
) {
  if (!process.env.FIREWORKS_API_KEY) {
    throw new Error("Missing FIREWORKS_API_KEY environment variable.");
  }

  const body: any = {
    model: FIREWORKS_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    max_tokens: options.maxTokens || 1000,
    temperature: options.temperature ?? 0.7
  };

  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }

  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.FIREWORKS_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.status === 429) {
        if (attempt === MAX_RETRIES) {
          throw new Error("Fireworks AI rate limit exceeded after maximum retries.");
        }
        const delay = INITIAL_DELAY * Math.pow(2, attempt);
        console.warn(`[Fireworks] Rate limit hit (429). Retrying in ${delay}ms... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        attempt++;
        continue;
      }

      if (!response.ok) {
        throw new Error(data.error?.message || "Fireworks AI request failed");
      }

      const result = data.choices?.[0]?.message?.content || "";

      if (!result.trim()) {
        throw new Error("Fireworks AI returned an empty response.");
      }

      return result.trim();
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      const delay = INITIAL_DELAY * Math.pow(2, attempt);
      console.error(`[Fireworks] Request failed: ${error instanceof Error ? error.message : String(error)}. Retrying in ${delay}ms...`);
      await sleep(delay);
      attempt++;
    }
  }

  throw new Error("Fireworks AI request failed after multiple attempts.");
}

let groqClient: Groq | null = null;

export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  options: { maxTokens?: number; temperature?: number } = {}
) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY environment variable.");
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    max_tokens: options.maxTokens || 1000,
    temperature: options.temperature ?? 0.7
  });

  const result = response.choices[0]?.message?.content || "";

  if (!result.trim()) {
    throw new Error("Groq returned an empty response.");
  }

  return result.trim();
}
