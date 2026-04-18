import { Redis } from "@upstash/redis";

export type AutonomousUser = {
  userId: string;
  websiteUrl: string;
  enabled: boolean;
};

export type AnalysisReport = {
  output: string;
  timestamp: string;
  seen: boolean;
};

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

// Redis key helpers
const AUTONOMOUS_USER_KEY = (userId: string) => `autonomous_user:${userId}`;
const ANALYSIS_REPORT_KEY = (userId: string) => `analysis_report:${userId}`;
const ALL_AUTONOMOUS_USERS_KEY = "all_autonomous_users";

export async function getAutonomousUsers(): Promise<AutonomousUser[]> {
  const userIds = await redis.smembers(ALL_AUTONOMOUS_USERS_KEY);
  if (!userIds || userIds.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of userIds) {
    pipeline.get(AUTONOMOUS_USER_KEY(id as string));
  }
  const results = await pipeline.exec();

  return results.filter((r): r is AutonomousUser => r !== null);
}

export async function setAutonomousUser(user: AutonomousUser) {
  const pipeline = redis.pipeline();
  pipeline.set(AUTONOMOUS_USER_KEY(user.userId), user);
  pipeline.sadd(ALL_AUTONOMOUS_USERS_KEY, user.userId);
  await pipeline.exec();
}

export async function deleteAutonomousUser(userId: string) {
  const pipeline = redis.pipeline();
  pipeline.del(AUTONOMOUS_USER_KEY(userId));
  pipeline.srem(ALL_AUTONOMOUS_USERS_KEY, userId);
  await pipeline.exec();
}

export async function getAnalysisReport(userId: string): Promise<AnalysisReport | null> {
  return await redis.get<AnalysisReport>(ANALYSIS_REPORT_KEY(userId));
}

export async function setAnalysisReport(userId: string, report: AnalysisReport) {
  await redis.set(ANALYSIS_REPORT_KEY(userId), report);
}

// Telegram Integration Helpers
const TELEGRAM_MAPPING_KEY = (userId: string) => `telegram_chat:${userId}`;

export async function setTelegramChatId(userId: string, chatId: string | number) {
  await redis.set(TELEGRAM_MAPPING_KEY(userId), chatId.toString());
}

export async function getTelegramChatId(userId: string): Promise<string | null> {
  return await redis.get<string>(TELEGRAM_MAPPING_KEY(userId));
}
