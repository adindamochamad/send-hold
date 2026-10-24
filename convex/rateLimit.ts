import { ConvexError, v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const WINDOW_MS = 60 * 1000;
const MAX_CALLS = 30;

export const consume = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = Date.now();
    const row = await ctx.db
      .query("rateLimits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!row || now - row.windowStart >= WINDOW_MS) {
      if (row) {
        await ctx.db.patch(row._id, { windowStart: now, count: 1 });
      } else {
        await ctx.db.insert("rateLimits", {
          userId,
          windowStart: now,
          count: 1,
        });
      }
      return;
    }

    if (row.count >= MAX_CALLS) {
      throw new ConvexError({ code: "rate_limited", message: "Too many Qloo requests. Try again in a minute." });
    }

    await ctx.db.patch(row._id, { count: row.count + 1 });
  },
});

export async function assertRateLimit(
  ctx: { runMutation: (ref: typeof consume, args: { userId: Id<"users"> }) => Promise<void> },
  userId: Id<"users">,
) {
  await ctx.runMutation(consume, { userId });
}
