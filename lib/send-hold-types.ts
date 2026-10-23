import type { PlanLine, SheetStatus } from "../app/plans";

export type TraceStep = {
  id: string;
  label: string;
  reason?: string;
};

export type LineVerdict = {
  role: PlanLine["role"];
  name: string;
  inSet: boolean;
  held?: boolean;
  replacement?: string;
};

export type PlanEvaluation = {
  status: SheetStatus;
  trace: TraceStep[];
  lines: LineVerdict[];
  heldRole?: PlanLine["role"];
  source: "qloo" | "fixture";
};

export type SendLogEntry = {
  at: string;
  planId: string;
  headliner: string;
  city: string;
  source: PlanEvaluation["source"];
};
