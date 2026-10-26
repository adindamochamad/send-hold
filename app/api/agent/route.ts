import { AGENT_TOOL_DESCRIPTORS } from "../../../lib/agent-tools";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  const payload = {
    ...AGENT_TOOL_DESCRIPTORS,
    origin,
    examples: {
      evaluateByPlanId: {
        ...AGENT_TOOL_DESCRIPTORS.examples.evaluateByPlanId,
        curl: AGENT_TOOL_DESCRIPTORS.examples.evaluateByPlanId.curl.replace("$ORIGIN", origin),
      },
      evaluateCustom: {
        ...AGENT_TOOL_DESCRIPTORS.examples.evaluateCustom,
        curl: AGENT_TOOL_DESCRIPTORS.examples.evaluateCustom.curl.replace("$ORIGIN", origin),
      },
    },
  };

  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>Send Hold agent tools</title></head>
<body>
<h1>Send Hold agent tools</h1>
<p>${payload.description}</p>
<h2>evaluate_night_plan</h2>
<pre>${payload.examples.evaluateByPlanId.curl}</pre>
<h2>send_night_plan</h2>
<pre>curl -sS -X POST "${origin}/api/agent/send" -H "Content-Type: application/json" -d '{"planId":"open-door"}'</pre>
<p><a href="/">Demo</a> · JSON: <code>Accept: application/json</code></p>
</body>
</html>`;
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return Response.json(payload);
}
