import { Injectable } from '@nestjs/common';

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

@Injectable()
export class SalesReportCacheService {
  private static readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs = 30_000;

  get<T>(key: string): T | undefined {
    const entry = SalesReportCacheService.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt < Date.now()) {
      SalesReportCacheService.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T) {
    SalesReportCacheService.cache.set(key, {
      expiresAt: Date.now() + this.ttlMs,
      value,
    });
  }

  invalidateTenant(tenantId: string) {
    for (const key of SalesReportCacheService.cache.keys()) {
      if (key.startsWith(`${tenantId}:`)) {
        SalesReportCacheService.cache.delete(key);
      }
    }
  }
}
