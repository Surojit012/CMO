export async function publishToDevTo(title: string, content: string, tags: string[] = ["growth", "startup"]) {
  if (!process.env.DEVTO_API_KEY) {
    throw new Error("Missing DEVTO_API_KEY environment variable.");
  }

  const response = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: {
      "api-key": process.env.DEVTO_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      article: {
        title,
        body_markdown: content,
        published: true,
        tags
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to publish to Dev.to");
  }

  return data.url as string;
}
