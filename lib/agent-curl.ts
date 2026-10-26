import type { AgentBody } from "./agent-request";

export function buildEvaluateCurl(origin: string, body: AgentBody): string {
  const json = JSON.stringify(body);
  return `curl -sS -X POST "${origin}/api/agent/evaluate" -H "Content-Type: application/json" -d '${json.replace(/'/g, "'\\''")}'`;
}
