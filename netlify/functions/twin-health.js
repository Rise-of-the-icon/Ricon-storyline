function normalizeTwinEnv() {
  const apiKey = String(process.env.ANTHROPIC_API_KEY || "").trim();
  return {
    hasUsableApiKey: apiKey.length >= 20
  };
}

function healthPayload() {
  const env = normalizeTwinEnv();
  if (!env.hasUsableApiKey) {
    return {
      status: "degraded",
      reason: "configuration-incomplete",
      message: "Companion is running in fallback mode for this environment."
    };
  }
  return {
    status: "available",
    reason: "ready",
    message: "Companion service is ready."
  };
}

export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response("Method not allowed. Use GET to fetch companion health.", { status: 405 });
  }
  try {
    return new Response(JSON.stringify(healthPayload()), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch {
    return new Response(JSON.stringify({
      status: "unavailable",
      reason: "health-check-failed",
      message: "Companion status is temporarily unavailable."
    }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
