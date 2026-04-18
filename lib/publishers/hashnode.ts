export async function publishToHashnode(title: string, content: string) {
  if (!process.env.HASHNODE_API_KEY || !process.env.HASHNODE_PUBLICATION_ID) {
    throw new Error("Missing HASHNODE_API_KEY or HASHNODE_PUBLICATION_ID environment variable.");
  }

  const query = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          url
        }
      }
    }
  `;

  const variables = {
    input: {
      title,
      contentMarkdown: content,
      publicationId: process.env.HASHNODE_PUBLICATION_ID,
      tags: [{ name: "growth", slug: "growth" }] // Required by Hashnode
    }
  };

  const response = await fetch("https://gql.hashnode.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.HASHNODE_API_KEY
    },
    body: JSON.stringify({ query, variables })
  });

  const data = await response.json();
  if (data.errors || !response.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to publish to Hashnode");
  }

  return data.data.publishPost.post.url as string;
}
