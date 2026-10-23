import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlanEvaluation } from "../../lib/send-hold-types";

vi.mock("../../lib/plan-evaluation", () => ({
  evaluatePlan: vi.fn(),
}));

import { evaluatePlan } from "../../lib/plan-evaluation";
import { sendPlanAction } from "./send-hold";

function evaluation(overrides: Partial<PlanEvaluation>): PlanEvaluation {
  return {
    status: "cleared",
    trace: [],
    lines: [],
    source: "qloo",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendPlanAction", () => {
  it("returns log entry when plan is cleared", async () => {
    vi.mocked(evaluatePlan).mockResolvedValue(evaluation({ status: "cleared" }));

    const result = await sendPlanAction("open-door");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.log.planId).toBe("open-door");
      expect(result.log.source).toBe("qloo");
      expect(result.message).toContain("Taylor Swift");
    }
  });

  it("rejects held plans without a log entry", async () => {
    vi.mocked(evaluatePlan).mockResolvedValue(evaluation({ status: "held" }));

    const result = await sendPlanAction("north-wharf");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("held");
    }
  });

  it("rejects silent plans without a log entry", async () => {
    vi.mocked(evaluatePlan).mockResolvedValue(
      evaluation({
        status: "silent",
        trace: [{ id: "headliner", label: "search · artist · no answer · not_found" }],
      }),
    );

    const result = await sendPlanAction("late");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("silent");
    }
  });
});
