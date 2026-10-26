export const AGENT_TOOL_DESCRIPTORS = {
  name: "send-hold",
  description:
    "Qloo-gated send pipeline for live-night folios. Evaluate whether Support, Dinner, and Drink belong in the headliner's affiliated set before send.",
  tools: [
    {
      name: "evaluate_night_plan",
      description:
        "Resolve entities in Qloo and check affiliation. Returns held, silent, or cleared plus trace and in-set alternatives.",
      method: "POST",
      path: "/api/agent/evaluate",
      inputSchema: {
        oneOf: [
          {
            type: "object",
            required: ["planId"],
            properties: {
              planId: {
                type: "string",
                enum: ["north-wharf", "canal", "late", "open-door"],
                description: "Hackathon demo folio id",
              },
            },
          },
          {
            type: "object",
            required: ["headliner", "lines"],
            properties: {
              headliner: { type: "string" },
              city: { type: "string" },
              lines: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "object",
                  required: ["role", "name"],
                  properties: {
                    role: { type: "string", enum: ["Support", "Dinner", "Drink"] },
                    name: { type: "string" },
                    entityId: { type: "string" },
                  },
                },
              },
            },
          },
        ],
      },
    },
    {
      name: "send_night_plan",
      description:
        "Re-evaluate with Qloo, then log send only when status is cleared. Refuses held and silent.",
      method: "POST",
      path: "/api/agent/send",
      inputSchema: {
        $ref: "#/tools/0/inputSchema",
      },
    },
  ],
  demoPlanIds: ["north-wharf", "canal", "late", "open-door"],
  examples: {
    evaluateByPlanId: {
      curl: `curl -sS -X POST "$ORIGIN/api/agent/evaluate" -H "Content-Type: application/json" -d '{"planId":"north-wharf"}'`,
      body: { planId: "north-wharf" },
    },
    evaluateCustom: {
      curl: `curl -sS -X POST "$ORIGIN/api/agent/evaluate" -H "Content-Type: application/json" -d '{"headliner":"Taylor Swift","city":"New York","lines":[{"role":"Support","name":"Carly Rae Jepsen"},{"role":"Dinner","name":"Joe Pizza"},{"role":"Drink","name":"Keds"}]}'`,
    },
  },
} as const;
