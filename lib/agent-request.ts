import { plans } from "../app/plans";
import type { EvaluatablePlan, PlanLine, PlanLineRole } from "./plan-types";

const ROLES: PlanLineRole[] = ["Support", "Dinner", "Drink"];

export type AgentCustomBody = {
  headliner: string;
  city?: string;
  lines: PlanLine[];
};

export type AgentBody = { planId: string } | AgentCustomBody;

export type ResolvePlanResult =
  | { ok: true; plan: EvaluatablePlan }
  | { ok: false; error: string; status: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAgentBody(raw: unknown): AgentBody | { error: string; status: number } {
  if (!isRecord(raw)) {
    return { error: "JSON body required.", status: 400 };
  }

  if (typeof raw.planId === "string" && raw.planId.trim()) {
    const planId = raw.planId.trim();
    if (raw.headliner !== undefined || raw.lines !== undefined) {
      return { error: "Use either planId or headliner+lines, not both.", status: 400 };
    }
    return { planId };
  }

  if (typeof raw.headliner !== "string" || !raw.headliner.trim()) {
    return { error: "headliner (string) or planId required.", status: 400 };
  }

  if (!Array.isArray(raw.lines) || raw.lines.length !== 3) {
    return { error: "lines must be an array of exactly three entries (Support, Dinner, Drink).", status: 400 };
  }

  const lines: PlanLine[] = [];
  const seen = new Set<PlanLineRole>();

  for (const entry of raw.lines) {
    if (!isRecord(entry) || typeof entry.name !== "string" || !entry.name.trim()) {
      return { error: "Each line needs role and name.", status: 400 };
    }
    if (typeof entry.role !== "string" || !ROLES.includes(entry.role as PlanLineRole)) {
      return { error: "Each line role must be Support, Dinner, or Drink.", status: 400 };
    }
    const role = entry.role as PlanLineRole;
    if (seen.has(role)) {
      return { error: "Duplicate line role.", status: 400 };
    }
    seen.add(role);
    lines.push({
      role,
      name: entry.name.trim(),
      entityId: typeof entry.entityId === "string" ? entry.entityId : undefined,
    });
  }

  for (const role of ROLES) {
    if (!seen.has(role)) {
      return { error: "lines must include Support, Dinner, and Drink.", status: 400 };
    }
  }

  const city = typeof raw.city === "string" && raw.city.trim() ? raw.city.trim() : "—";

  return {
    headliner: raw.headliner.trim(),
    city,
    lines,
  };
}

export function resolveEvaluatablePlan(body: AgentBody): ResolvePlanResult {
  if ("planId" in body) {
    const plan = plans.find((item) => item.id === body.planId);
    if (!plan) {
      return { ok: false, error: "Plan not found.", status: 404 };
    }
    return { ok: true, plan };
  }

  const plan: EvaluatablePlan = {
    id: "custom",
    label: "Custom",
    day: "—",
    city: body.city ?? "—",
    headliner: body.headliner,
    lines: body.lines,
  };

  return { ok: true, plan };
}

export function agentRequestPayloadForPlan(plan: EvaluatablePlan): { planId: string } | AgentBody {
  const demo = plans.find((item) => item.id === plan.id);
  if (demo) {
    return { planId: plan.id };
  }
  return {
    headliner: plan.headliner,
    city: plan.city,
    lines: plan.lines.map((line) => ({
      role: line.role,
      name: line.name,
      ...(line.entityId ? { entityId: line.entityId } : {}),
    })),
  };
}
