import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Plan } from "../app/plans";
import { evaluatePlan, ROLE_ENTITY_TYPE } from "./plan-evaluation";
import * as qloo from "./qloo/core";

vi.mock("./qloo/core", async (importOriginal) => {
  const actual = await importOriginal<typeof qloo>();
  return {
    ...actual,
    isQlooConfiguredFromConfig: vi.fn(() => true),
    searchEntityCore: vi.fn(),
    checkEntityInAffiliatedSetCore: vi.fn(),
    suggestAffiliatedEntityCore: vi.fn(),
  };
});

const clearedPlan: Plan = {
  id: "open-door",
  label: "Open Door",
  day: "Sunday",
  city: "Chicago",
  headliner: "Taylor Swift",
  lines: [
    { role: "Support", name: "Carly Rae Jepsen" },
    { role: "Dinner", name: "Park Güell" },
    { role: "Drink", name: "Keds" },
  ],
};

const heldPlan: Plan = {
  id: "north-wharf",
  label: "North Wharf",
  day: "Thursday",
  city: "New York",
  headliner: "Taylor Swift",
  lines: [
    { role: "Support", name: "Carly Rae Jepsen" },
    { role: "Dinner", name: "Joe Pizza" },
    { role: "Drink", name: "Keds" },
  ],
};

const silentPlan: Plan = {
  id: "late",
  label: "Late Set",
  day: "Saturday",
  city: "Los Angeles",
  headliner: "zzznomatch999xyz",
  silent: true,
  lines: [
    { role: "Support", name: "Gold Window" },
    { role: "Dinner", name: "Patio Twelve" },
    { role: "Drink", name: "Dry Lantern" },
  ],
};

function mockSearch(ids: Record<string, string>) {
  vi.mocked(qloo.searchEntityCore).mockImplementation(async (_config, query, entityType) => {
    const key = `${query}:${entityType}`;
    const entityId = ids[key];
    if (!entityId) {
      return { ok: false, reason: "not_found" };
    }
    return {
      ok: true,
      data: { results: [{ entity_id: entityId, name: query }] },
    };
  });
}

function mockAffinity(inSetById: Record<string, boolean>) {
  vi.mocked(qloo.checkEntityInAffiliatedSetCore).mockImplementation(
    async (_config, _headlinerId, candidateId) => ({
      ok: true,
      data: { inSet: inSetById[candidateId] ?? false },
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(qloo.isQlooConfiguredFromConfig).mockReturnValue(true);
  vi.mocked(qloo.suggestAffiliatedEntityCore).mockResolvedValue({
    ok: false,
    reason: "not_found",
  });
});

describe("evaluatePlan", () => {
  it("returns cleared when every line is in set", async () => {
    mockSearch({
      "Taylor Swift:urn:entity:artist": "headliner-1",
      "Carly Rae Jepsen:urn:entity:artist": "support-1",
      "Park Güell:urn:entity:place": "dinner-1",
      "Keds:urn:entity:brand": "drink-1",
    });
    mockAffinity({
      "support-1": true,
      "dinner-1": true,
      "drink-1": true,
    });

    const result = await evaluatePlan(clearedPlan);

    expect(result.status).toBe("cleared");
    expect(result.source).toBe("qloo");
    expect(result.lines.every((line) => line.inSet)).toBe(true);
  });

  it("returns held with honest inSet per line and Qloo alt on held line", async () => {
    mockSearch({
      "Taylor Swift:urn:entity:artist": "headliner-1",
      "Carly Rae Jepsen:urn:entity:artist": "support-1",
      "Joe Pizza:urn:entity:place": "dinner-1",
      "Keds:urn:entity:brand": "drink-1",
    });
    mockAffinity({
      "support-1": true,
      "dinner-1": false,
      "drink-1": true,
    });
    vi.mocked(qloo.suggestAffiliatedEntityCore).mockResolvedValue({
      ok: true,
      data: { entity_id: "alt-dinner", name: "Qloo Alt Place" },
    });

    const result = await evaluatePlan(heldPlan);

    expect(result.status).toBe("held");
    expect(result.heldRole).toBe("Dinner");
    const support = result.lines.find((line) => line.role === "Support");
    const dinner = result.lines.find((line) => line.role === "Dinner");
    const drink = result.lines.find((line) => line.role === "Drink");
    expect(support?.inSet).toBe(true);
    expect(dinner?.inSet).toBe(false);
    expect(drink?.inSet).toBe(true);
    expect(dinner?.replacement).toBe("Qloo Alt Place");
    expect(result.trace.some((step) => step.label.includes("alt · Qloo Alt Place"))).toBe(
      true,
    );
  });

  it("returns silent with reason when headliner does not resolve", async () => {
    vi.mocked(qloo.searchEntityCore).mockResolvedValueOnce({
      ok: false,
      reason: "not_found",
    });

    const result = await evaluatePlan(silentPlan);

    expect(result.status).toBe("silent");
    expect(result.trace.some((step) => step.reason === "not_found")).toBe(true);
  });

  it("skips headliner search when headlinerEntityId is set", async () => {
    mockAffinity({
      "support-picked": true,
      "dinner-picked": true,
      "drink-picked": true,
    });

    const plan: Plan = {
      ...clearedPlan,
      headlinerEntityId: "headliner-picked",
      lines: [
        { role: "Support", name: "Carly Rae Jepsen", entityId: "support-picked" },
        { role: "Dinner", name: "Park Güell", entityId: "dinner-picked" },
        { role: "Drink", name: "Keds", entityId: "drink-picked" },
      ],
    };

    const result = await evaluatePlan(plan);

    expect(result.status).toBe("cleared");
    expect(qloo.searchEntityCore).not.toHaveBeenCalled();
  });

  it("skips search when line entityId is set", async () => {
    mockSearch({
      "Taylor Swift:urn:entity:artist": "headliner-1",
    });
    mockAffinity({
      "support-picked": true,
      "dinner-picked": true,
      "drink-picked": true,
    });

    const plan: Plan = {
      ...clearedPlan,
      lines: [
        { role: "Support", name: "Carly Rae Jepsen", entityId: "support-picked" },
        { role: "Dinner", name: "Park Güell", entityId: "dinner-picked" },
        { role: "Drink", name: "Keds", entityId: "drink-picked" },
      ],
    };

    const result = await evaluatePlan(plan);

    expect(result.status).toBe("cleared");
    expect(qloo.searchEntityCore).toHaveBeenCalledTimes(1);
    expect(qloo.searchEntityCore).toHaveBeenCalledWith(
      expect.anything(),
      "Taylor Swift",
      ROLE_ENTITY_TYPE.Support,
    );
  });

  it("searches Drink lines as urn:entity:brand (no type override)", async () => {
    mockSearch({
      "Beyoncé:urn:entity:artist": "headliner-b",
      "Demi Lovato:urn:entity:artist": "support-b",
      "Park Güell:urn:entity:place": "dinner-b",
      "Mammee Noodle Snack:urn:entity:brand": "drink-b",
    });
    mockAffinity({
      "support-b": true,
      "dinner-b": true,
      "drink-b": false,
    });

    const canal: Plan = {
      id: "canal",
      label: "Canal Room",
      day: "Friday",
      city: "London",
      headliner: "Beyoncé",
      lines: [
        { role: "Support", name: "Demi Lovato" },
        { role: "Dinner", name: "Park Güell" },
        { role: "Drink", name: "Mammee Noodle Snack" },
      ],
    };

    await evaluatePlan(canal);

    expect(qloo.searchEntityCore).toHaveBeenCalledWith(
      expect.anything(),
      "Mammee Noodle Snack",
      ROLE_ENTITY_TYPE.Drink,
    );
  });
});
