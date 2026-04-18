import { createTimeoutSignal } from "./timeout";

const JINA_READER_BASE_URL = "https://r.jina.ai/";
const MAX_CONTENT_CHARS = 5_000;
const SCRAPE_FALLBACK_MESSAGE =
  "Website content could not be retrieved reliably. Generate a best-effort growth analysis from the URL and any limited context available, while clearly favoring high-confidence recommendations.";

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function fetchWebsiteContent(targetUrl: string) {
  const timeout = createTimeoutSignal(12_000);
  const readerUrl = `${JINA_READER_BASE_URL}${targetUrl}`;

  try {
    const response = await fetch(readerUrl, {
      method: "GET",
      headers: {
        Accept: "text/plain, text/markdown;q=0.9, */*;q=0.8",
        "User-Agent": "CMO/0.1 (+https://example.com)"
      },
      redirect: "follow",
      signal: timeout.signal
    });

    if (!response.ok) {
      return {
        title: "",
        metaDescription: "",
        visibleText: SCRAPE_FALLBACK_MESSAGE
      };
    }

    const rawContent = await response.text();
    const visibleText = cleanText(rawContent).slice(0, MAX_CONTENT_CHARS);

    return {
      title: "",
      metaDescription: "",
      visibleText: visibleText || SCRAPE_FALLBACK_MESSAGE
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        title: "",
        metaDescription: "",
        visibleText: "Website scraping timed out. Generate a concise best-effort growth analysis without assuming missing page details."
      };
    }

    return {
      title: "",
      metaDescription: "",
      visibleText: SCRAPE_FALLBACK_MESSAGE
    };
  } finally {
    timeout.clear();
  }
}
