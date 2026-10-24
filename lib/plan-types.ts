export type PlanLineRole = "Support" | "Dinner" | "Drink";

export type PlanLine = {
  role: PlanLineRole;
  name: string;
  entityId?: string;
  /** Fixture only: marks which line is held when QLOO_API_KEY is unset. */
  held?: boolean;
};

export type EvaluatablePlan = {
  id: string;
  label: string;
  day: string;
  city: string;
  headliner: string;
  headlinerEntityId?: string;
  lines: PlanLine[];
  /** Fixture only: Qloo does not answer for this folio. */
  silent?: boolean;
  negativeControlNote?: string;
};

export type SheetStatus = "held" | "silent" | "cleared";
