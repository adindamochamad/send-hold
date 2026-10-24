import "server-only";

import type { QlooSearchResponse } from "./types";
import {
  checkEntityInAffiliatedSetCore,
  isQlooConfiguredFromConfig,
  searchEntityCore,
  suggestAffiliatedEntityCore,
  type QlooConfig,
  type QlooFetchReason,
} from "./core";

const DEFAULT_BASE = "https://hackathon.api.qloo.com";

function configFromEnv(): QlooConfig {
  return {
    apiKey: process.env.QLOO_API_KEY?.trim(),
    baseUrl: process.env.QLOO_API_BASE_URL ?? DEFAULT_BASE,
  };
}

export type { QlooFetchReason };

export function isQlooConfigured(): boolean {
  return isQlooConfiguredFromConfig(configFromEnv());
}

export async function searchEntity(
  query: string,
  entityType: string,
  take = "6",
): Promise<
  | { ok: true; data: QlooSearchResponse }
  | { ok: false; reason: QlooFetchReason }
> {
  return searchEntityCore(configFromEnv(), query, entityType, take);
}

export async function checkEntityInAffiliatedSet(
  headlinerId: string,
  candidateId: string,
  targetType: string,
): Promise<
  | { ok: true; data: { inSet: boolean } }
  | { ok: false; reason: QlooFetchReason }
> {
  return checkEntityInAffiliatedSetCore(
    configFromEnv(),
    headlinerId,
    candidateId,
    targetType,
  );
}

export async function suggestAffiliatedEntity(
  headlinerId: string,
  targetType: string,
  excludeId: string,
): Promise<
  | { ok: true; data: { entity_id: string; name: string } }
  | { ok: false; reason: QlooFetchReason }
> {
  return suggestAffiliatedEntityCore(
    configFromEnv(),
    headlinerId,
    targetType,
    excludeId,
  );
}
