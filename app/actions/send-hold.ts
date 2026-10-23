"use server";

import { plans } from "../plans";
import { evaluatePlan } from "../../lib/plan-evaluation";
import type { PlanEvaluation, SendLogEntry } from "../../lib/send-hold-types";

export type SendResult =
  | { ok: true; message: string; evaluation: PlanEvaluation; log: SendLogEntry }
  | {
      ok: false;
      code: "not_found" | "held" | "silent";
      message: string;
      evaluation: PlanEvaluation;
    };

export async function evaluatePlanAction(planId: string): Promise<PlanEvaluation | null> {
  const plan = plans.find((item) => item.id === planId);
  if (!plan) {
    return null;
  }
  return evaluatePlan(plan);
}

export async function sendPlanAction(planId: string): Promise<SendResult> {
  const plan = plans.find((item) => item.id === planId);
  if (!plan) {
    return {
      ok: false,
      code: "not_found",
      message: "Plan not found.",
      evaluation: {
        status: "silent",
        trace: [],
        lines: [],
        source: "fixture",
      },
    };
  }

  const evaluation = await evaluatePlan(plan);

  if (evaluation.status === "silent") {
    return {
      ok: false,
      code: "silent",
      message: "Qloo did not answer. Nothing was sent.",
      evaluation,
    };
  }

  if (evaluation.status === "held") {
    return {
      ok: false,
      code: "held",
      message: "This line does not send. It is not in the headliner's affiliated set.",
      evaluation,
    };
  }

  const log: SendLogEntry = {
    at: new Date().toISOString(),
    planId: plan.id,
    headliner: plan.headliner,
    city: plan.city,
    source: evaluation.source,
  };

  return {
    ok: true,
    message: `Sent: ${plan.headliner} · ${plan.city}`,
    evaluation,
    log,
  };
}
