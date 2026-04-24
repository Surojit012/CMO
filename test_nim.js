const SYSTEM_PROMPT = `Test harness for NVIDIA NIM integration.`;
const userMessage = `Run a basic market audit smoke test.`;

async function test() {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing NVIDIA_API_KEY environment variable.");
  }

  const aiResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "nvidia/llama-3.1-nemotron-70b-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    })
  });

  const data = await aiResponse.json();
  console.log(JSON.stringify(data, null, 2));
}

test().catch((error) => {
  console.error(error);
  process.exit(1);
});
