import type { PlanEvaluation } from "./send-hold-types";

export type EmailSendInput = {
  from: string;
  to: string;
  subject: string;
  text: string;
  send: (input: { from: string; to: string; subject: string; text: string }) => Promise<
    | { ok: true; id?: string }
    | { ok: false; error: string }
  >;
};

export function gateBeforeEmailSend(
  evaluation: PlanEvaluation,
): { proceed: true } | { proceed: false; code: "silent" | "held"; message: string } {
  if (evaluation.status === "silent") {
    return {
      proceed: false,
      code: "silent",
      message: "Qloo did not answer. Nothing was sent.",
    };
  }
  if (evaluation.status === "held") {
    return {
      proceed: false,
      code: "held",
      message: "This line does not send. It is not in the headliner's affiliated set.",
    };
  }
  return { proceed: true };
}

export async function sendClearedPlanEmail(
  input: EmailSendInput,
): Promise<{ ok: true; resendId?: string } | { ok: false; error: string }> {
  const result = await input.send({
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, resendId: result.id };
}
