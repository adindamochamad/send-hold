import "server-only";

import {
  checkEntityInAffiliatedSet,
  isQlooConfigured,
  searchEntity,
  suggestAffiliatedEntity,
  type QlooFetchReason,
} from "./qloo/client";
import type { Plan, PlanLine, SheetStatus } from "../app/plans";
import type { LineVerdict, PlanEvaluation, TraceStep } from "./send-hold-types";

export type { LineVerdict, PlanEvaluation, TraceStep } from "./send-hold-types";

export const ROLE_ENTITY_TYPE: Record<PlanLine["role"], string> = {
  Support: "urn:entity:artist",
  Dinner: "urn:entity:place",
  Drink: "urn:entity:brand",
};

export function entityKindForType(entityType: string): "artist" | "place" | "brand" {
  if (entityType === "urn:entity:artist") {
    return "artist";
  }
  if (entityType === "urn:entity:place") {
    return "place";
  }
  return "brand";
}

function traceNoAnswer(traceId: string, kind: string, reason?: QlooFetchReason): TraceStep {
  const suffix = reason ? ` · ${reason}` : "";
  return { id: traceId, label: `insights · ${kind} · no answer${suffix}`, reason };
}

function fixtureEvaluation(plan: Plan): PlanEvaluation {
  if (plan.silent) {
    const trace: TraceStep[] = [
      { id: "search", label: `search · ${plan.headliner}` },
      { id: "artist", label: "insights · artist · no answer" },
      { id: "place", label: "insights · place · no answer" },
      { id: "brand", label: "insights · brand · no answer" },
    ];
    return {
      status: "silent",
      trace,
      lines: plan.lines.map((line) => ({
        role: line.role,
        name: line.name,
        inSet: false,
      })),
      source: "fixture",
    };
  }

  const heldLine = plan.lines.find((line) => line.held);
  const status: SheetStatus = heldLine ? "held" : "cleared";

  const placeHeld = status === "held" && heldLine?.role === "Dinner";
  const brandHeld = status === "held" && heldLine?.role === "Drink";

  const trace: TraceStep[] = [
    { id: "search", label: `search · ${plan.headliner}` },
    { id: "artist", label: "insights · artist · in set" },
    {
      id: "place",
      label: `insights · place · ${placeHeld ? "not in set" : "in set"}`,
    },
    {
      id: "brand",
      label: `insights · brand · ${brandHeld ? "not in set" : "in set"}`,
    },
  ];

  const lines: LineVerdict[] = plan.lines.map((line) => ({
    role: line.role,
    name: line.name,
    inSet: status === "cleared" ? true : !line.held,
    held: line.held,
  }));

  return {
    status,
    trace,
    lines,
    heldRole: heldLine?.role,
    source: "fixture",
  };
}

function silentEvaluation(plan: Plan, trace: TraceStep[]): PlanEvaluation {
  return {
    status: "silent",
    trace,
    lines: plan.lines.map((line) => ({
      role: line.role,
      name: line.name,
      inSet: false,
      held: line.held,
    })),
    source: "qloo",
  };
}

export async function evaluatePlan(plan: Plan): Promise<PlanEvaluation> {
  if (!isQlooConfigured()) {
    return fixtureEvaluation(plan);
  }

  const trace: TraceStep[] = [{ id: "search", label: `search · ${plan.headliner}` }];

  const headlinerSearch = await searchEntity(plan.headliner, "urn:entity:artist");
  if (!headlinerSearch.ok) {
    const suffix = ` · ${headlinerSearch.reason}`;
    trace.push({
      id: "headliner",
      label: `search · artist · no answer${suffix}`,
      reason: headlinerSearch.reason,
    });
    return silentEvaluation(plan, trace);
  }

  const headliner = headlinerSearch.data.results?.[0];
  if (!headliner?.entity_id) {
    trace.push({
      id: "headliner",
      label: "search · artist · no answer · not_found",
      reason: "not_found",
    });
    return silentEvaluation(plan, trace);
  }

  trace.push({ id: "headliner", label: "search · artist · resolved" });

  const lineResults: LineVerdict[] = [];
  let heldRole: PlanLine["role"] | undefined;

  for (const line of plan.lines) {
    const entityType = ROLE_ENTITY_TYPE[line.role];
    const search = await searchEntity(line.name, entityType);
    const kind = entityKindForType(entityType);

    if (!search.ok) {
      trace.push(traceNoAnswer(line.role.toLowerCase(), kind, search.reason));
      return silentEvaluation(plan, trace);
    }

    const entity = search.data.results?.[0];
    if (!entity?.entity_id) {
      trace.push(traceNoAnswer(line.role.toLowerCase(), kind, "not_found"));
      return silentEvaluation(plan, trace);
    }

    const affinity = await checkEntityInAffiliatedSet(
      headliner.entity_id,
      entity.entity_id,
      entityType,
    );

    if (!affinity.ok) {
      trace.push(traceNoAnswer(line.role.toLowerCase(), kind, affinity.reason));
      return silentEvaluation(plan, trace);
    }

    const inSet = affinity.data.inSet;
    trace.push({
      id: line.role.toLowerCase(),
      label: `insights · ${kind} · ${inSet ? "in set" : "not in set"}`,
    });

    let replacement: string | undefined;
    if (!inSet) {
      if (!heldRole) {
        heldRole = line.role;
      }
      const suggest = await suggestAffiliatedEntity(
        headliner.entity_id,
        entityType,
        entity.entity_id,
      );
      if (suggest.ok) {
        replacement = suggest.data.name;
        trace.push({
          id: `${line.role.toLowerCase()}-alt`,
          label: `insights · ${kind} · alt · ${replacement}`,
        });
      }
    }

    lineResults.push({
      role: line.role,
      name: line.name,
      inSet,
      held: !inSet,
      replacement,
    });
  }

  const status: SheetStatus = heldRole ? "held" : "cleared";

  return {
    status,
    trace,
    lines: lineResults,
    heldRole,
    source: "qloo",
  };
}
