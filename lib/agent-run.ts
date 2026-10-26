import { evaluatePlan } from "./plan-evaluation";
import { parseAgentBody, resolveEvaluatablePlan } from "./agent-request";
import type { PlanEvaluation, SendLogEntry } from "./send-hold-types";

export type AgentEvaluateResponse = {
  ok: true;
  evaluation: PlanEvaluation;
  planId: string;
  headliner: string;
  city: string;
};

export type AgentSendResponse =
  | {
      ok: true;
      message: string;
      evaluation: PlanEvaluation;
      log: SendLogEntry;
    }
  | {
      ok: false;
      code: "not_found" | "held" | "silent";
      message: string;
      evaluation: PlanEvaluation;
    };

export type AgentErrorResponse = { ok: false; error: string };

export async function runAgentEvaluateFromBody(
  raw: unknown,
): Promise<AgentEvaluateResponse | AgentErrorResponse & { status: number }> {
  const parsed = parseAgentBody(raw);
  if ("error" in parsed) {
    return { ok: false, error: parsed.error, status: parsed.status };
  }

  const resolved = resolveEvaluatablePlan(parsed);
  if (!resolved.ok) {
    return { ok: false, error: resolved.error, status: resolved.status };
  }

  const evaluation = await evaluatePlan(resolved.plan);

  return {
    ok: true,
    evaluation,
    planId: resolved.plan.id,
    headliner: resolved.plan.headliner,
    city: resolved.plan.city,
  };
}

export async function runAgentSendFromBody(
  raw: unknown,
): Promise<(AgentSendResponse & { status: number }) | (AgentErrorResponse & { status: number })> {
  const parsed = parseAgentBody(raw);
  if ("error" in parsed) {
    return { ok: false, error: parsed.error, status: parsed.status };
  }

  const resolved = resolveEvaluatablePlan(parsed);
  if (!resolved.ok) {
    return { ok: false, error: resolved.error, status: resolved.status };
  }

  const plan = resolved.plan;
  const evaluation = await evaluatePlan(plan);

  if (evaluation.status === "silent") {
    return {
      ok: false,
      code: "silent",
      message: "Qloo did not answer. Nothing was sent.",
      evaluation,
      status: 409,
    };
  }

  if (evaluation.status === "held") {
    return {
      ok: false,
      code: "held",
      message: "This line does not send. It is not in the headliner's affiliated set.",
      evaluation,
      status: 409,
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
    message: `Logged: ${plan.headliner} · ${plan.city}`,
    evaluation,
    log,
    status: 200,
  };
}
