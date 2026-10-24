import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const TTL_MS = 10 * 60 * 1000;

export const get = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("qlooCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!row || row.expiresAt < Date.now()) {
      return null;
    }
    return row.payload;
  },
});

export const set = internalMutation({
  args: { key: v.string(), payload: v.string() },
  handler: async (ctx, { key, payload }) => {
    const existing = await ctx.db
      .query("qlooCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        payload,
        expiresAt: Date.now() + TTL_MS,
      });
      return;
    }
    await ctx.db.insert("qlooCache", {
      key,
      payload,
      expiresAt: Date.now() + TTL_MS,
    });
  },
});
