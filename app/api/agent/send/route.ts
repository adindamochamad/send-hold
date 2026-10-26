import { runAgentSendFromBody } from "../../../../lib/agent-run";

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const result = await runAgentSendFromBody(raw);
  if (!result.ok) {
    if ("error" in result) {
      return Response.json({ ok: false, error: result.error }, { status: result.status });
    }
    return Response.json(result, { status: result.status });
  }

  return Response.json(result);
}
