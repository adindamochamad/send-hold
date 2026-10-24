import { describe, expect, it, vi } from "vitest";
import { gateBeforeEmailSend, sendClearedPlanEmail } from "./send-plan-email";
import type { PlanEvaluation } from "./send-hold-types";

const cleared: PlanEvaluation = {
  status: "cleared",
  source: "qloo",
  trace: [],
  lines: [],
};

const held: PlanEvaluation = { ...cleared, status: "held" };
const silent: PlanEvaluation = { ...cleared, status: "silent" };

describe("gateBeforeEmailSend", () => {
  it("blocks held and silent", () => {
    expect(gateBeforeEmailSend(held)).toEqual({
      proceed: false,
      code: "held",
      message: expect.any(String),
    });
    expect(gateBeforeEmailSend(silent)).toEqual({
      proceed: false,
      code: "silent",
      message: expect.any(String),
    });
  });

  it("allows cleared", () => {
    expect(gateBeforeEmailSend(cleared)).toEqual({ proceed: true });
  });
});

describe("sendClearedPlanEmail", () => {
  it("returns resend id on success", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true, id: "msg_123" });
    const result = await sendClearedPlanEmail({
      from: "a@b.com",
      to: "c@d.com",
      subject: "test",
      text: "body",
      send,
    });
    expect(result).toEqual({ ok: true, resendId: "msg_123" });
    expect(send).toHaveBeenCalledOnce();
  });

  it("surfaces provider errors", async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, error: "SMTP down" });
    const result = await sendClearedPlanEmail({
      from: "a@b.com",
      to: "c@d.com",
      subject: "test",
      text: "body",
      send,
    });
    expect(result).toEqual({ ok: false, error: "SMTP down" });
  });
});
