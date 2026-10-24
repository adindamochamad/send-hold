import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getPlanBundle = internalQuery({
  args: { planId: v.id("plans") },
  handler: async (ctx, { planId }) => {
    const plan = await ctx.db.get(planId);
    if (!plan) {
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
