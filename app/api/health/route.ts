import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { isQlooConfigured } from "../../../lib/qloo/client";

export async function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  let convexOk = false;

  if (convexUrl) {
    try {
      const client = new ConvexHttpClient(convexUrl);
      const ping = await client.query(api.health.ping, {});
      convexOk = ping.ok;
    } catch {
      convexOk = false;
    }
  }

  return Response.json({
    ok: true,
    next: true,
    convex: convexOk,
    qlooConfigured: isQlooConfigured(),
  });
}
