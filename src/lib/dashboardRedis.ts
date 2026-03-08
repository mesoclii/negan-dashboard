import Redis from "ioredis";

let redisClient: Redis | null | undefined;
let redisSubscriber: Redis | null | undefined;
const listeners = new Map<string, Set<(payload: any) => void>>();

function getRedisUrl() {
  return String(process.env.REDIS_URL || "").trim();
}

function readJson(input: string) {
  try {
    return input ? JSON.parse(input) : null;
  } catch {
    return null;
  }
}

export function getDashboardRedis() {
  if (redisClient !== undefined) return redisClient;

  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
  });

  redisClient.on("error", () => {});
  return redisClient;
}

function getDashboardSubscriber() {
  if (redisSubscriber !== undefined) return redisSubscriber;
  const redis = getDashboardRedis();
  if (!redis) {
    redisSubscriber = null;
    return redisSubscriber;
  }
  redisSubscriber = redis.duplicate();
  redisSubscriber.on("message", (channel, message) => {
    const payload = readJson(message);
    for (const handler of listeners.get(channel) || []) {
      try {
        handler(payload);
      } catch {
        // ignore subscriber handler failures
      }
    }
  });
  redisSubscriber.on("error", () => {});
  return redisSubscriber;
}

export async function readRedisJson<T = any>(key: string): Promise<T | null> {
  const redis = getDashboardRedis();
  if (!redis || !key) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (readJson(raw) as T | null) : null;
  } catch {
    return null;
  }
}

export async function writeRedisJson(key: string, value: unknown, ttlSeconds = 60) {
  const redis = getDashboardRedis();
  if (!redis || !key) return false;
  try {
    await redis.set(key, JSON.stringify(value ?? null), "EX", Math.max(5, ttlSeconds));
    return true;
  } catch {
    return false;
  }
}

export async function deleteRedisKey(key: string) {
  const redis = getDashboardRedis();
  if (!redis || !key) return false;
  try {
    await redis.del(key);
    return true;
  } catch {
    return false;
  }
}

export async function publishDashboardEvent(channel: string, payload: unknown) {
  const redis = getDashboardRedis();
  if (!redis || !channel) return false;
  try {
    await redis.publish(channel, JSON.stringify(payload ?? null));
    return true;
  } catch {
    return false;
  }
}

export async function subscribeDashboardEvent(channel: string, handler: (payload: any) => void) {
  const subscriber = getDashboardSubscriber();
  if (!subscriber || !channel) return false;

  let channelHandlers = listeners.get(channel);
  if (!channelHandlers) {
    channelHandlers = new Set();
    listeners.set(channel, channelHandlers);
    try {
      await subscriber.subscribe(channel);
    } catch {
      listeners.delete(channel);
      return false;
    }
  }

  channelHandlers.add(handler);
  return true;
}
