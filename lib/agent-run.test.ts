import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlanEvaluation } from "./send-hold-types";

vi.mock("./plan-evaluation", () => ({
  evaluatePlan: vi.fn(),
}));

import { evaluatePlan } from "./plan-evaluation";
import { parseAgentBody, resolveEvaluatablePlan } from "./agent-request";
import { runAgentEvaluateFromBody, runAgentSendFromBody } from "./agent-run";

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

describe("parseAgentBody", () => {
  it("accepts demo planId", () => {
    const body = parseAgentBody({ planId: "north-wharf" });
    expect(body).toEqual({ planId: "north-wharf" });
  });

  it("rejects unknown plan on resolve", () => {
    const resolved = resolveEvaluatablePlan({ planId: "missing" });
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.status).toBe(404);
    }
  });

  it("accepts custom headliner and three lines", () => {
    const body = parseAgentBody({
      headliner: "Taylor Swift",
      city: "New York",
      lines: [
        { role: "Support", name: "A" },
        { role: "Dinner", name: "B" },
        { role: "Drink", name: "C" },
      ],
    });
    expect("headliner" in body && body.headliner).toBe("Taylor Swift");
  });
});

describe("runAgentEvaluateFromBody", () => {
  it("returns evaluation for demo planId", async () => {
    vi.mocked(evaluatePlan).mockResolvedValue(evaluation({ status: "held" }));

    const result = await runAgentEvaluateFromBody({ planId: "north-wharf" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.planId).toBe("north-wharf");
      expect(result.evaluation.status).toBe("held");
    }
  });

  it("returns 404 for unknown planId", async () => {
    const result = await runAgentEvaluateFromBody({ planId: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
  });
});

describe("runAgentSendFromBody", () => {
  it("returns log when cleared", async () => {
    vi.mocked(evaluatePlan).mockResolvedValue(evaluation({ status: "cleared" }));

    const result = await runAgentSendFromBody({ planId: "open-door" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.log.planId).toBe("open-door");
    }
  });

  it("rejects held without log", async () => {
    vi.mocked(evaluatePlan).mockResolvedValue(evaluation({ status: "held" }));

    const result = await runAgentSendFromBody({ planId: "north-wharf" });

    expect(result.ok).toBe(false);
    if (!result.ok && "code" in result) {
      expect(result.code).toBe("held");
      expect(result.status).toBe(409);
    }
  });

  it("rejects silent without log", async () => {
    vi.mocked(evaluatePlan).mockResolvedValue(evaluation({ status: "silent" }));

    const result = await runAgentSendFromBody({ planId: "late" });

    expect(result.ok).toBe(false);
    if (!result.ok && "code" in result) {
      expect(result.code).toBe("silent");
      expect(result.status).toBe(409);
    }
  });
});
