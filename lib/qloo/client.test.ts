import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { searchEntity } from "./client";

describe("qloo client", () => {
  const originalKey = process.env.QLOO_API_KEY;
  const originalBase = process.env.QLOO_API_BASE_URL;

  beforeEach(() => {
    process.env.QLOO_API_KEY = "test-key";
    process.env.QLOO_API_BASE_URL = "https://hackathon.api.qloo.com";
  });

  afterEach(() => {
    process.env.QLOO_API_KEY = originalKey;
    process.env.QLOO_API_BASE_URL = originalBase;
    vi.unstubAllGlobals();
  });

  it("maps 401 responses to unauthorized", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 401,
        ok: false,
      })),
    );

    const result = await searchEntity("Taylor Swift", "urn:entity:artist");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("unauthorized");
    }
  });

  it("maps 403 responses to unauthorized", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 403,
        ok: false,
      })),
    );

    const result = await searchEntity("Taylor Swift", "urn:entity:artist");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("unauthorized");
    }
  });
});
