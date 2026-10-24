import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const lineRole = v.union(
  v.literal("Support"),
  v.literal("Dinner"),
  v.literal("Drink"),
);

const sheetStatus = v.union(
  v.literal("held"),
  v.literal("silent"),
  v.literal("cleared"),
);

const traceStep = v.object({
  id: v.string(),
  label: v.string(),
  reason: v.optional(v.string()),
});

const lineVerdict = v.object({
  role: lineRole,
  name: v.string(),
  inSet: v.boolean(),
  held: v.optional(v.boolean()),
  replacement: v.optional(v.string()),
  replacementEntityId: v.optional(v.string()),
});

export default defineSchema({
  ...authTables,

  plans: defineTable({
    userId: v.id("users"),
    label: v.string(),
    day: v.string(),
    city: v.string(),
    headliner: v.string(),
    headlinerEntityId: v.optional(v.string()),
    notifyEmail: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  planLines: defineTable({
    planId: v.id("plans"),
    role: lineRole,
    name: v.string(),
    entityId: v.optional(v.string()),
    entityType: v.string(),
    sortOrder: v.number(),
  }).index("by_plan", ["planId"]),

  evaluations: defineTable({
    planId: v.id("plans"),
    userId: v.id("users"),
    status: sheetStatus,
    source: v.union(v.literal("qloo"), v.literal("fixture")),
    trace: v.array(traceStep),
    lines: v.array(lineVerdict),
    heldRole: v.optional(lineRole),
    createdAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_user", ["userId"]),

  sends: defineTable({
    planId: v.id("plans"),
    evaluationId: v.id("evaluations"),
    userId: v.id("users"),
    to: v.string(),
    ok: v.boolean(),
    resendId: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_plan", ["planId"]),

  qlooCache: defineTable({
    key: v.string(),
    payload: v.string(),
    expiresAt: v.number(),
  }).index("by_key", ["key"]),

  rateLimits: defineTable({
    userId: v.id("users"),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_user", ["userId"]),
});
