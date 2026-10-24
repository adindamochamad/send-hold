import type { QlooInsightsResponse, QlooSearchResponse } from "./types";

export type QlooFetchReason =
  | "missing_key"
  | "not_found"
  | "unauthorized"
  | "http_error"
  | "network";

export type QlooConfig = {
  apiKey?: string;
  baseUrl: string;
};

type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: QlooFetchReason };

export function isQlooConfiguredFromConfig(config: QlooConfig): boolean {
  return Boolean(config.apiKey?.trim());
}

function normalizeBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

async function qlooFetch<T>(
  config: QlooConfig,
  path: string,
  searchParams: Record<string, string>,
): Promise<FetchResult<T>> {
  const key = config.apiKey?.trim();
  if (!key) {
    return { ok: false, reason: "missing_key" };
  }

  const url = new URL(path, `${normalizeBase(config.baseUrl)}/`);
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

export async function searchEntityCore(
  config: QlooConfig,
  query: string,
  entityType: string,
  take = "6",
): Promise<FetchResult<QlooSearchResponse>> {
  return qlooFetch<QlooSearchResponse>(config, "/search", {
    query,
    types: entityType,
    take,
  });
}

export async function checkEntityInAffiliatedSetCore(
  config: QlooConfig,
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

  const result = await qlooFetch<QlooInsightsResponse>(config, "/v2/insights/", params);

  if (!result.ok) {
    return result;
  }

  const entities = result.data.results?.entities ?? [];
  const match = entities.find((e) => e.entity_id === candidateId);
  const affinity = match?.query?.affinity ?? match?.affinity;
  const inSet = Boolean(match && (affinity === undefined || affinity > 0));

  return { ok: true, data: { inSet } };
}

export async function suggestAffiliatedEntityCore(
  config: QlooConfig,
  headlinerId: string,
  targetType: string,
  excludeId: string,
): Promise<FetchResult<{ entity_id: string; name: string }>> {
  const result = await qlooFetch<QlooInsightsResponse>(config, "/v2/insights/", {
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
