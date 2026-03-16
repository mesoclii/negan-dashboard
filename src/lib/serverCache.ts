"use strict";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const STORE = new Map<string, CacheEntry<unknown>>();

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
}

export function deleteServerCachePrefix(prefix: string) {
  const normalized = String(prefix || "");
  if (!normalized) return;
  for (const key of STORE.keys()) {
    if (key.startsWith(normalized)) {
      STORE.delete(key);
    }
  }
}
