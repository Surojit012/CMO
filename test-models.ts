import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function listModels() {
  const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`
    }
  });

  const data = await res.json();
  if (data.data) {
    const models = data.data.map((m: any) => m.id);
    console.log("Available Models:", models.filter((m: string) => m.includes("llama")));
  } else {
    console.log("Error fetching models:", data);
  }
}

listModels().catch(console.error);
