"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { Resend } from "resend";
import { evaluatePlanCore } from "../lib/plan-evaluation-core";
import type { EvaluatablePlan } from "../lib/plan-types";
import type { PlanEvaluation } from "../lib/send-hold-types";
import { gateBeforeEmailSend, sendClearedPlanEmail } from "../lib/send-plan-email";
import { searchEntityCore } from "../lib/qloo/core";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { action, type ActionCtx } from "./_generated/server";
import { buildCachedQlooRuntime } from "./cachedQloo";
import { qlooConfigFromEnv } from "./qlooEnv";

async function runEvaluate(ctx: ActionCtx, userId: Id<"users">, plan: EvaluatablePlan) {
  const config = qlooConfigFromEnv();
  const runtime = await buildCachedQlooRuntime(ctx, config, async () => {
    await ctx.runMutation(internal.rateLimit.consume, { userId });
  });
  return evaluatePlanCore(plan, config, runtime);
}

function toEvaluatablePlan(
  plan: {
    _id: string;
    label: string;
    day: string;
    city: string;
    headliner: string;
    headlinerEntityId?: string;
  },
  lines: Array<{
    role: "Support" | "Dinner" | "Drink";
    name: string;
    entityId?: string;
  }>,
): EvaluatablePlan {
  return {
    id: plan._id,
    label: plan.label,
    day: plan.day,
    city: plan.city,
    headliner: plan.headliner,
    headlinerEntityId: plan.headlinerEntityId,
    lines: lines.map((l) => ({
      role: l.role,
      name: l.name,
      entityId: l.entityId,
    })),
  };
}

export const searchEntities = action({
  args: {
    query: v.string(),
    entityType: v.string(),
  },
  handler: async (ctx, { query, entityType }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({ code: "unauthorized", message: "Sign in required" });
    }
    if (!query.trim()) {
      return { ok: true as const, results: [] };
    }

    const config = qlooConfigFromEnv();
    let result: Awaited<ReturnType<typeof searchEntityCore>>;
    try {
      const runtime = await buildCachedQlooRuntime(ctx, config, async () => {
        await ctx.runMutation(internal.rateLimit.consume, { userId });
      });
      result = await runtime.searchEntity(query.trim(), entityType);
    } catch (e) {
      if (e instanceof ConvexError && (e.data as { code?: string })?.code === "rate_limited") {
        return { ok: false as const, reason: "rate_limited" as const };
      }
      throw e;
    }

    if (!result.ok) {
      return { ok: false as const, reason: result.reason };
    }
    const results =
      result.data.results?.map((r) => ({
        entity_id: r.entity_id,
        name: r.name ?? "",
      })) ?? [];
    return { ok: true as const, results };
  },
});

export const evaluateUserPlan = action({
  args: { planId: v.id("plans") },
  handler: async (ctx, { planId }): Promise<{ evaluation: PlanEvaluation; evaluationId: Id<"evaluations"> }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({ code: "unauthorized", message: "Sign in required" });
    }

    const bundle = await ctx.runQuery(internal.productHelpers.getPlanBundle, { planId });
    if (!bundle || bundle.plan.userId !== userId) {
      throw new ConvexError({ code: "not_found", message: "Plan not found" });
    }

    let evaluation: PlanEvaluation;
    try {
      evaluation = await runEvaluate(
        ctx,
        userId,
        toEvaluatablePlan(bundle.plan, bundle.lines),
      );
    } catch (e) {
      if (e instanceof ConvexError && (e.data as { code?: string })?.code === "rate_limited") {
        throw new ConvexError({ code: "rate_limited", message: "Too many Qloo requests." });
      }
      throw e;
    }

    const evaluationId: Id<"evaluations"> = await ctx.runMutation(
      internal.productMutations.recordEvaluation,
      {
        planId,
        userId,
        status: evaluation.status,
        source: evaluation.source,
        trace: evaluation.trace,
        lines: evaluation.lines,
        heldRole: evaluation.heldRole,
      },
    );

    return { evaluation, evaluationId };
  },
});

type SendUserPlanResult =
  | {
      ok: false;
      code: "silent" | "held" | "send_failed";
      message: string;
      evaluation: PlanEvaluation;
      evaluationId: Id<"evaluations">;
      sendId?: Id<"sends">;
    }
  | {
      ok: true;
      message: string;
      evaluation: PlanEvaluation;
      evaluationId: Id<"evaluations">;
      sendId: Id<"sends">;
    };

export const sendUserPlan = action({
  args: { planId: v.id("plans") },
  handler: async (ctx, { planId }): Promise<SendUserPlanResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({ code: "unauthorized", message: "Sign in required" });
    }

    const bundle = await ctx.runQuery(internal.productHelpers.getPlanBundle, { planId });
    if (!bundle || bundle.plan.userId !== userId) {
      throw new ConvexError({ code: "not_found", message: "Plan not found" });
    }

    let evaluation: PlanEvaluation;
    try {
      evaluation = await runEvaluate(
        ctx,
        userId,
        toEvaluatablePlan(bundle.plan, bundle.lines),
      );
    } catch (e) {
      if (e instanceof ConvexError && (e.data as { code?: string })?.code === "rate_limited") {
        throw new ConvexError({ code: "rate_limited", message: "Too many Qloo requests." });
      }
      throw e;
    }

    const evaluationId: Id<"evaluations"> = await ctx.runMutation(
      internal.productMutations.recordEvaluation,
      {
        planId,
        userId,
        status: evaluation.status,
        source: evaluation.source,
        trace: evaluation.trace,
        lines: evaluation.lines,
        heldRole: evaluation.heldRole,
      },
    );

    const gate = gateBeforeEmailSend(evaluation);
    if (!gate.proceed) {
      return {
        ok: false,
        code: gate.code,
        message: gate.message,
        evaluation,
        evaluationId,
      };
    }

    const to = bundle.plan.notifyEmail.trim();
    if (!to) {
      throw new ConvexError({ code: "invalid", message: "Notify email is required." });
    }

    const from = process.env.SEND_HOLD_FROM_EMAIL?.trim();
    const apiKey = process.env.RESEND_API_KEY?.trim();

    let resendId: string | undefined;
    let error: string | undefined;
    let sentOk = false;

    if (!apiKey || !from) {
      error = "RESEND_API_KEY or SEND_HOLD_FROM_EMAIL not configured";
    } else {
      const resend = new Resend(apiKey);
      const body = [
        `Send Hold — plan cleared`,
        ``,
        `${bundle.plan.headliner} · ${bundle.plan.city}`,
        bundle.lines.map((l) => `${l.role}: ${l.name}`).join("\n"),
        ``,
        `Source: ${evaluation.source}`,
      ].join("\n");

      const emailResult = await sendClearedPlanEmail({
        from,
        to,
        subject: `Send Hold: ${bundle.plan.label}`,
        text: body,
        send: async (payload) => {
          const { data, error: sendError } = await resend.emails.send(payload);
          if (sendError) {
            return { ok: false, error: sendError.message };
          }
          return { ok: true, id: data?.id };
        },
      });

      if (!emailResult.ok) {
        error = emailResult.error;
      } else {
        sentOk = true;
        resendId = emailResult.resendId;
      }
    }

    const sendId: Id<"sends"> = await ctx.runMutation(internal.productMutations.recordSend, {
      planId,
      evaluationId,
      userId,
      to,
      ok: sentOk,
      resendId,
      error,
    });

    if (!sentOk) {
      return {
        ok: false,
        code: "send_failed",
        message: error ?? "Email failed",
        evaluation,
        evaluationId,
        sendId,
      };
    }

    return {
      ok: true,
      message: `Sent to ${to}`,
      evaluation,
      evaluationId,
      sendId,
    };
  },
});
