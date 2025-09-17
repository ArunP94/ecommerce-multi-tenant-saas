import { Redis } from "@upstash/redis";

export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : undefined;

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  if (!redis) return { allowed: true, remaining: limit - 1 };
  const now = Math.floor(Date.now() / 1000);
  const bucket = `${key}:${Math.floor(now / windowSeconds)}`;
  const count = (await redis.incr(bucket)) ?? 0;
  if (count === 1) await redis.expire(bucket, windowSeconds);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}