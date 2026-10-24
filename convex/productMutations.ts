import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const recordEvaluation = internalMutation({
  args: {
    planId: v.id("plans"),
    userId: v.id("users"),
    status: v.union(v.literal("held"), v.literal("silent"), v.literal("cleared")),
    source: v.union(v.literal("qloo"), v.literal("fixture")),
    trace: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        reason: v.optional(v.string()),
      }),
    ),
    lines: v.array(
      v.object({
        role: v.union(v.literal("Support"), v.literal("Dinner"), v.literal("Drink")),
        name: v.string(),
        inSet: v.boolean(),
        held: v.optional(v.boolean()),
        replacement: v.optional(v.string()),
        replacementEntityId: v.optional(v.string()),
      }),
    ),
    heldRole: v.optional(
      v.union(v.literal("Support"), v.literal("Dinner"), v.literal("Drink")),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("evaluations", {
      planId: args.planId,
      userId: args.userId,
      status: args.status,
      source: args.source,
      trace: args.trace,
      lines: args.lines,
      heldRole: args.heldRole,
      createdAt: Date.now(),
    });
  },
});

export const recordSend = internalMutation({
  args: {
    planId: v.id("plans"),
    evaluationId: v.id("evaluations"),
    userId: v.id("users"),
    to: v.string(),
    ok: v.boolean(),
    resendId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sends", {
      planId: args.planId,
      evaluationId: args.evaluationId,
      userId: args.userId,
      to: args.to,
      ok: args.ok,
      resendId: args.resendId,
      error: args.error,
      createdAt: Date.now(),
    });
  },
});
