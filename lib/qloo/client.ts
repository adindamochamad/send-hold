import "server-only";

import type {
  QlooInsightsResponse,
  QlooSearchResponse,
} from "./types";

const DEFAULT_BASE = "https://hackathon.api.qloo.com";

function baseUrl(): string {
  return (process.env.QLOO_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");
}

function apiKey(): string | undefined {
  const key = process.env.QLOO_API_KEY?.trim();
  return key || undefined;
}

export function isQlooConfigured(): boolean {
  return Boolean(apiKey());
}

export type QlooFetchReason =
  | "missing_key"
  | "not_found"
  | "unauthorized"
  | "http_error"
  | "network";

type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: QlooFetchReason };

async function qlooFetch<T>(path: string, searchParams: Record<string, string>): Promise<FetchResult<T>> {
  const key = apiKey();
  if (!key) {
    return { ok: false, reason: "missing_key" };
  }

  const url = new URL(path, `${baseUrl()}/`);
  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { "X-Api-Key": key },
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      return { ok: false, reason: "unauthorized" };
    }

    if (response.status === 404) {
      return { ok: false, reason: "not_found" };
    }

    if (!response.ok) {
      return { ok: false, reason: "http_error" };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function searchEntity(
  query: string,
  entityType: string,
  take = "6",
): Promise<FetchResult<QlooSearchResponse>> {
  return qlooFetch<QlooSearchResponse>("/search", {
    query,
    types: entityType,
    take,
  });
}

/** Assess whether `candidateId` is in the affiliated set for `headlinerId` at `targetType`. */
export async function checkEntityInAffiliatedSet(
  headlinerId: string,
  candidateId: string,
  targetType: string,
): Promise<FetchResult<{ inSet: boolean }>> {
  const params: Record<string, string> = {
    "filter.type": targetType,
    "signal.interests.entities": headlinerId,
    "filter.results.entities": candidateId,
    take: "25",
  };

  const result = await qlooFetch<QlooInsightsResponse>("/v2/insights/", params);

  if (!result.ok) {
    return result;
  }

  const entities = result.data.results?.entities ?? [];
  const match = entities.find((e) => e.entity_id === candidateId);
  const affinity = match?.query?.affinity ?? match?.affinity;
  const inSet = Boolean(match && (affinity === undefined || affinity > 0));

  return { ok: true, data: { inSet } };
}

/** First affiliated entity of `targetType` for `headlinerId`, excluding `excludeId`. */
export async function suggestAffiliatedEntity(
  headlinerId: string,
  targetType: string,
  excludeId: string,
): Promise<FetchResult<{ entity_id: string; name: string }>> {
  const result = await qlooFetch<QlooInsightsResponse>("/v2/insights/", {
    "filter.type": targetType,
    "signal.interests.entities": headlinerId,
    take: "25",
  });

  if (!result.ok) {
    return result;
  }

  const entities = result.data.results?.entities ?? [];
  for (const entity of entities) {
    if (entity.entity_id === excludeId) {
      continue;
    }
    const affinity = entity.query?.affinity ?? entity.affinity;
    if (affinity !== undefined && affinity <= 0) {
      continue;
    }
    const name = entity.name?.trim();
    if (!name) {
      continue;
    }
    return { ok: true, data: { entity_id: entity.entity_id, name } };
  }

  return { ok: false, reason: "not_found" };
}
