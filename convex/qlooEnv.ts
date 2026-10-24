const DEFAULT_BASE = "https://hackathon.api.qloo.com";

export function qlooConfigFromEnv() {
  return {
    apiKey: process.env.QLOO_API_KEY,
    baseUrl: process.env.QLOO_API_BASE_URL ?? DEFAULT_BASE,
  };
}
