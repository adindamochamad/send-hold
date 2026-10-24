import {
  checkEntityInAffiliatedSetCore,
  searchEntityCore,
  suggestAffiliatedEntityCore,
  type QlooConfig,
} from "../lib/qloo/core";
import type { QlooRuntime } from "../lib/qloo/runtime";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

async function readCache(ctx: ActionCtx, key: string): Promise<string | null> {
  return await ctx.runQuery(internal.qlooCache.get, { key });
}

async function writeCache(ctx: ActionCtx, key: string, payload: string): Promise<void> {
  await ctx.runMutation(internal.qlooCache.set, { key, payload });
}

export async function buildCachedQlooRuntime(
  ctx: ActionCtx,
  config: QlooConfig,
  onCacheMiss?: () => Promise<void>,
): Promise<QlooRuntime> {
  async function onMiss() {
    if (onCacheMiss) {
      await onCacheMiss();
    }
  }

  return {
    async searchEntity(query, entityType) {
      const key = `search:${entityType}:${query.trim().toLowerCase()}`;
      const cached = await readCache(ctx, key);
      if (cached) {
        return JSON.parse(cached) as Awaited<ReturnType<typeof searchEntityCore>>;
      }
      await onMiss();
      const result = await searchEntityCore(config, query, entityType);
      if (result.ok) {
        await writeCache(ctx, key, JSON.stringify(result));
      }
      return result;
    },

    async checkEntityInAffiliatedSet(headlinerId, candidateId, targetType) {
      const key = `insights:${headlinerId}:${targetType}:${candidateId}`;
      const cached = await readCache(ctx, key);
      if (cached) {
        return JSON.parse(cached) as Awaited<ReturnType<typeof checkEntityInAffiliatedSetCore>>;
      }
      await onMiss();
      const result = await checkEntityInAffiliatedSetCore(
        config,
        headlinerId,
        candidateId,
        targetType,
      );
      if (result.ok) {
        await writeCache(ctx, key, JSON.stringify(result));
      }
      return result;
    },

    async suggestAffiliatedEntity(headlinerId, targetType, excludeId) {
      const key = `insights-alt:${headlinerId}:${targetType}:${excludeId}`;
      const cached = await readCache(ctx, key);
      if (cached) {
        return JSON.parse(cached) as Awaited<ReturnType<typeof suggestAffiliatedEntityCore>>;
      }
      await onMiss();
      const result = await suggestAffiliatedEntityCore(
        config,
        headlinerId,
        targetType,
        excludeId,
      );
      if (result.ok) {
        await writeCache(ctx, key, JSON.stringify(result));
      }
      return result;
    },
  };
}
