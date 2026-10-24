import "server-only";

import { evaluatePlanCore } from "./plan-evaluation-core";
import type { EvaluatablePlan } from "./plan-types";
import type { PlanEvaluation } from "./send-hold-types";

export {
  ROLE_ENTITY_TYPE,
  entityKindForType,
  evaluatePlanCore,
} from "./plan-evaluation-core";

const DEFAULT_BASE = "https://hackathon.api.qloo.com";

function configFromEnv() {
  return {
    apiKey: process.env.QLOO_API_KEY?.trim(),
    baseUrl: process.env.QLOO_API_BASE_URL ?? DEFAULT_BASE,
  };
}

export async function evaluatePlan(plan: EvaluatablePlan): Promise<PlanEvaluation> {
  return evaluatePlanCore(plan, configFromEnv());
}
