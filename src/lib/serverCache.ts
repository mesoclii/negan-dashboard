"use strict";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const STORE = new Map<string, CacheEntry<unknown>>();
const INFLIGHT = new Map<string, Promise<unknown>>();

export function readServerCache<T>(key: string): T | null {
  const entry = STORE.get(String(key || ""));
  if (!entry) return null;
  if (Number(entry.expiresAt || 0) <= Date.now()) {
    STORE.delete(String(key || ""));
    return null;
  }
  return entry.value as T;
}

export function writeServerCache<T>(key: string, value: T, ttlMs: number): T {
  const normalizedKey = String(key || "");
  STORE.set(normalizedKey, {
    value,
    expiresAt: Date.now() + Math.max(1_000, Number(ttlMs || 0)),
  });

  if (STORE.size > 500) {
    for (const [entryKey, entry] of STORE.entries()) {
      if (Number(entry?.expiresAt || 0) <= Date.now()) {
        STORE.delete(entryKey);
      }
    }
  }

  return value;
}

export function deleteServerCache(key: string) {
  STORE.delete(String(key || ""));
  INFLIGHT.delete(String(key || ""));
}

export function deleteServerCachePrefix(prefix: string) {
  const normalized = String(prefix || "");
  if (!normalized) return;
  for (const key of STORE.keys()) {
    if (key.startsWith(normalized)) {
      STORE.delete(key);
    }
  }
  for (const key of INFLIGHT.keys()) {
    if (key.startsWith(normalized)) {
      INFLIGHT.delete(key);
    }
  }
}

export async function readOrCreateServerCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const normalizedKey = String(key || "");
  const cached = readServerCache<T>(normalizedKey);
  if (cached !== null) {
    return cached;
  }

  const inflight = INFLIGHT.get(normalizedKey);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const request = (async () => {
    const value = await loader();
    writeServerCache(normalizedKey, value, ttlMs);
    return value;
  })().finally(() => {
    INFLIGHT.delete(normalizedKey);
  });

  INFLIGHT.set(normalizedKey, request);
  return request;
}
