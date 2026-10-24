import type {
  checkEntityInAffiliatedSetCore,
  searchEntityCore,
  suggestAffiliatedEntityCore,
} from "./core";

export type QlooRuntime = {
  searchEntity: (
    query: string,
    entityType: string,
  ) => ReturnType<typeof searchEntityCore>;
  checkEntityInAffiliatedSet: (
    headlinerId: string,
    candidateId: string,
    targetType: string,
  ) => ReturnType<typeof checkEntityInAffiliatedSetCore>;
  suggestAffiliatedEntity: (
    headlinerId: string,
    targetType: string,
    excludeId: string,
  ) => ReturnType<typeof suggestAffiliatedEntityCore>;
};
