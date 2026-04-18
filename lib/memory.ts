import { Redis } from "@upstash/redis";

import { decrypt, encrypt } from "./encryption";
import type {
  FeedbackValue,
  MemoryContext,
  StoredAnalysis,
  StoredAnalysisPayload
} from "./types";

type DecryptedStoredAnalysis = StoredAnalysis & {
  payload: StoredAnalysisPayload;
};

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

// Redis key helpers
const ANALYSIS_KEY = (id: string) => `analysis:${id}`;
const USER_ANALYSES_KEY = (userId: string) => `user_analyses:${userId}`;
const ALL_ANALYSES_KEY = "all_analyses";

function getHostnameTokens(hostname: string) {
  return hostname
    .toLowerCase()
    .split(".")
    .flatMap((part) => part.split("-"))
    .filter(Boolean);
}

function calculateSimilarityScore(targetHostname: string, candidateHostname: string) {
  if (targetHostname === candidateHostname) {
    return 10;
  }

  if (
    targetHostname.endsWith(`.${candidateHostname}`) ||
    candidateHostname.endsWith(`.${targetHostname}`)
  ) {
    return 8;
  }

  const targetTokens = new Set(getHostnameTokens(targetHostname));
  const candidateTokens = getHostnameTokens(candidateHostname);
  const overlap = candidateTokens.filter((token) => targetTokens.has(token)).length;

  return overlap;
}

function decryptAnalysis(analysis: StoredAnalysis): DecryptedStoredAnalysis | null {
  try {
    const payload = JSON.parse(decrypt(analysis.encryptedOutput)) as StoredAnalysisPayload;

    return {
      ...analysis,
      payload
    };
  } catch {
    return null;
  }
}

function extractPatterns(analyses: DecryptedStoredAnalysis[], feedback: FeedbackValue) {
  return analyses
    .filter((analysis) => analysis.payload.feedback === feedback)
    .slice(0, 3)
    .map((analysis) =>
      analysis.payload.aiOutput.markdown
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .slice(0, 2)
        .join(" ")
    )
    .filter(Boolean);
}

async function getAllAnalyses(): Promise<StoredAnalysis[]> {
  const ids = await redis.lrange(ALL_ANALYSES_KEY, 0, -1);
  if (!ids || ids.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of ids) {
    pipeline.get(ANALYSIS_KEY(id as string));
  }
  const results = await pipeline.exec();

  return results.filter((r): r is StoredAnalysis => r !== null);
}

export async function getMemoryContext(websiteUrl: string, hostname: string): Promise<MemoryContext> {
  const analyses = await getAllAnalyses();
  const decrypted = analyses
    .map(decryptAnalysis)
    .filter((analysis): analysis is DecryptedStoredAnalysis => Boolean(analysis));
  const ranked = decrypted
    .map((analysis) => ({
      analysis,
      score: calculateSimilarityScore(hostname, analysis.payload.hostname)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => entry.analysis);

  const similarAnalyses = ranked.map((analysis) => ({
    websiteUrl: analysis.payload.websiteUrl,
    timestamp: analysis.timestamp,
    feedback: analysis.payload.feedback,
    markdown: analysis.payload.aiOutput.markdown
  }));

  const allForPatterns = decrypted
    .filter((analysis) => analysis.payload.websiteUrl !== websiteUrl)
    .slice(-20)
    .reverse();

  return {
    similarAnalyses,
    positivePatterns: extractPatterns(allForPatterns, "positive"),
    negativePatterns: extractPatterns(allForPatterns, "negative"),
    stats: {
      totalAnalyses: decrypted.length,
      positiveFeedback: decrypted.filter((analysis) => analysis.payload.feedback === "positive").length,
      negativeFeedback: decrypted.filter((analysis) => analysis.payload.feedback === "negative").length
    }
  };
}

export async function storeAnalysis(record: StoredAnalysis) {
  const pipeline = redis.pipeline();
  pipeline.set(ANALYSIS_KEY(record.id), record);
  pipeline.lpush(USER_ANALYSES_KEY(record.userId), record.id);
  pipeline.lpush(ALL_ANALYSES_KEY, record.id);
  await pipeline.exec();
}

export async function getAnalysisById(analysisId: string, userId: string) {
  const analysis = await redis.get<StoredAnalysis>(ANALYSIS_KEY(analysisId));

  if (!analysis || analysis.userId !== userId) {
    return null;
  }

  const decrypted = decryptAnalysis(analysis);

  if (!decrypted) {
    return null;
  }

  return {
    id: decrypted.id,
    userId: decrypted.userId,
    websiteUrl: decrypted.payload.websiteUrl,
    extractedContent: decrypted.payload.extractedContent,
    aiOutput: decrypted.payload.aiOutput,
    feedback: decrypted.payload.feedback,
    timestamp: decrypted.timestamp
  };
}

export async function storeFeedback(analysisId: string, feedback: FeedbackValue, userId: string) {
  const analysis = await redis.get<StoredAnalysis>(ANALYSIS_KEY(analysisId));

  if (!analysis || analysis.userId !== userId) {
    throw new Error("Analysis not found.");
  }

  const existing = decryptAnalysis(analysis);

  if (!existing) {
    throw new Error("Analysis not found.");
  }
  const updatedPayload: StoredAnalysisPayload = {
    ...existing.payload,
    feedback
  };

  const updatedAnalysis: StoredAnalysis = {
    ...analysis,
    encryptedOutput: encrypt(JSON.stringify(updatedPayload))
  };

  await redis.set(ANALYSIS_KEY(analysisId), updatedAnalysis);

  return updatedAnalysis;
}

export async function getLatestAnalysisByHostname(hostname: string) {
  const analyses = await getAllAnalyses();
  const decrypted = analyses
    .map(decryptAnalysis)
    .filter((analysis): analysis is DecryptedStoredAnalysis => Boolean(analysis));

  const matches = decrypted.filter((a) => a.payload.hostname === hostname);

  if (matches.length === 0) return null;

  matches.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return matches[0];
}
