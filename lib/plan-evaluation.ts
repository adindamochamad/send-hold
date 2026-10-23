import "server-only";

import {
  checkEntityInAffiliatedSet,
  isQlooConfigured,
  searchEntity,
  type QlooFetchReason,
} from "./qloo/client";
import type { Plan, PlanLine, SheetStatus } from "../app/plans";
import type { LineVerdict, PlanEvaluation, TraceStep } from "./send-hold-types";

export type { LineVerdict, PlanEvaluation, TraceStep } from "./send-hold-types";

const ROLE_ENTITY_TYPE: Record<PlanLine["role"], string> = {
  Support: "urn:entity:artist",
  Dinner: "urn:entity:place",
  Drink: "urn:entity:brand",
};

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
    replacement: line.replacement,
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
      replacement: line.replacement,
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
    trace.push(traceNoAnswer("headliner", "artist", headlinerSearch.reason));
    return silentEvaluation(plan, trace);
  }

  const headliner = headlinerSearch.data.results?.[0];
  if (!headliner?.entity_id) {
    trace.push(traceNoAnswer("headliner", "artist", "not_found"));
    return silentEvaluation(plan, trace);
  }

  trace.push({ id: "headliner", label: "insights · artist · in set" });

  const lineResults: LineVerdict[] = [];
  let heldRole: PlanLine["role"] | undefined;

  for (const line of plan.lines) {
    const entityType = line.searchEntityType ?? ROLE_ENTITY_TYPE[line.role];
    const search = await searchEntity(line.name, entityType);

    const kind =
      entityType === "urn:entity:artist"
        ? "artist"
        : entityType === "urn:entity:place"
          ? "place"
          : "brand";

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

    if (!inSet && !heldRole) {
      heldRole = line.role;
    }

    lineResults.push({
      role: line.role,
      name: line.name,
      inSet,
      held: !inSet,
      replacement: line.replacement,
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
