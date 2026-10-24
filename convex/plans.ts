import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const lineRole = v.union(
  v.literal("Support"),
  v.literal("Dinner"),
  v.literal("Drink"),
);

const lineInput = v.object({
  role: lineRole,
  name: v.string(),
  entityId: v.optional(v.string()),
  entityType: v.string(),
});

async function requireUserId(ctx: Parameters<typeof getAuthUserId>[0]) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not signed in");
  }
  return userId;
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return plans.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getWithLines = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, { planId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const plan = await ctx.db.get(planId);
    if (!plan || plan.userId !== userId) {
      return null;
    }
    const lines = await ctx.db
      .query("planLines")
      .withIndex("by_plan", (q) => q.eq("planId", planId))
      .collect();
    lines.sort((a, b) => a.sortOrder - b.sortOrder);
    return { plan, lines };
  },
});

export const listEvaluations = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, { planId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const plan = await ctx.db.get(planId);
    if (!plan || plan.userId !== userId) {
      return [];
    }
    const rows = await ctx.db
      .query("evaluations")
      .withIndex("by_plan", (q) => q.eq("planId", planId))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listSends = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, { planId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const plan = await ctx.db.get(planId);
    if (!plan || plan.userId !== userId) {
      return [];
    }
    const rows = await ctx.db
      .query("sends")
      .withIndex("by_plan", (q) => q.eq("planId", planId))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: {
    label: v.string(),
    day: v.string(),
    city: v.string(),
    headliner: v.string(),
    headlinerEntityId: v.optional(v.string()),
    notifyEmail: v.string(),
    lines: v.array(lineInput),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const planId = await ctx.db.insert("plans", {
      userId,
      label: args.label,
      day: args.day,
      city: args.city,
      headliner: args.headliner,
      headlinerEntityId: args.headlinerEntityId,
      notifyEmail: args.notifyEmail,
      updatedAt: now,
    });
    for (let i = 0; i < args.lines.length; i++) {
      const line = args.lines[i];
      await ctx.db.insert("planLines", {
        planId,
        role: line.role,
        name: line.name,
        entityId: line.entityId,
        entityType: line.entityType,
        sortOrder: i,
      });
    }
    return planId;
  },
});

export const update = mutation({
  args: {
    planId: v.id("plans"),
    label: v.string(),
    day: v.string(),
    city: v.string(),
    headliner: v.string(),
    headlinerEntityId: v.optional(v.string()),
    notifyEmail: v.string(),
    lines: v.array(lineInput),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== userId) {
      throw new Error("Plan not found");
    }
    await ctx.db.patch(args.planId, {
      label: args.label,
      day: args.day,
      city: args.city,
      headliner: args.headliner,
      headlinerEntityId: args.headlinerEntityId,
      notifyEmail: args.notifyEmail,
      updatedAt: Date.now(),
    });
    const existing = await ctx.db
      .query("planLines")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    for (let i = 0; i < args.lines.length; i++) {
      const line = args.lines[i];
      await ctx.db.insert("planLines", {
        planId: args.planId,
        role: line.role,
        name: line.name,
        entityId: line.entityId,
        entityType: line.entityType,
        sortOrder: i,
      });
    }
  },
});

export const applyLineReplacement = mutation({
  args: {
    planId: v.id("plans"),
    role: lineRole,
    name: v.string(),
    entityId: v.string(),
    entityType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== userId) {
      throw new Error("Plan not found");
    }
    const lines = await ctx.db
      .query("planLines")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    const target = lines.find((l) => l.role === args.role);
    if (!target) {
      throw new Error("Line not found");
    }
    await ctx.db.patch(target._id, {
      name: args.name,
      entityId: args.entityId,
      entityType: args.entityType,
    });
    await ctx.db.patch(args.planId, { updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, { planId }) => {
    const userId = await requireUserId(ctx);
    const plan = await ctx.db.get(planId);
    if (!plan || plan.userId !== userId) {
      throw new Error("Plan not found");
    }
    const lines = await ctx.db
      .query("planLines")
      .withIndex("by_plan", (q) => q.eq("planId", planId))
      .collect();
    for (const line of lines) {
      await ctx.db.delete(line._id);
    }
    await ctx.db.delete(planId);
  },
});
