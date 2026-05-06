import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

let hasWarnedTwinEnv = false;

function normalizeTwinEnv(rawEnv = {}) {
  const apiKey = String(rawEnv.ANTHROPIC_API_KEY || "").trim();
  const model = String(rawEnv.ANTHROPIC_MODEL || "").trim() || "claude-sonnet-4-20250514";
  const hasUsableApiKey = apiKey.length >= 20;
  return { apiKey, model, hasUsableApiKey };
}

function warnTwinEnv(message) {
  if (hasWarnedTwinEnv) return;
  hasWarnedTwinEnv = true;
  console.warn(`[ricon:twin-api] ${message}`);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function fallbackTwinReply(athlete, history = []) {
  const moments = athlete?.moments || [];
  const latestUserMessage = [...history].reverse().find((msg) => msg.role === "user")?.content || "";
  const lower = latestUserMessage.toLowerCase();
  const matched = moments.find((moment) => lower.includes(moment.y) || lower.includes(moment.title.toLowerCase().split(" ")[0]));
  const moment = matched || moments[history.length % Math.max(moments.length, 1)];

  if (!athlete || !moment) {
    return "That's beyond what I can speak to with certainty - but what I lived and what's documented, I can tell you.";
  }

  return `I am ${athlete.name}. When I look back at ${moment.y}, I see ${moment.title.toLowerCase()} as one of the moments that defined me. ${moment.body} That's the truth I can speak to from the record.`;
}

async function writeFallbackStream(res, text) {
  const words = text.split(/(\s+)/);
  for (const word of words) {
    res.write(word);
    await new Promise((resolve) => setTimeout(resolve, /\s+/.test(word) ? 8 : 34));
  }
  res.end();
}

function writeError(res, statusCode, message) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(message);
}

function writeJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function writeUnavailableError(res) {
  res.statusCode = 503;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("X-RICON-Companion-Fallback", "service-unavailable");
  res.end("The AI companion is temporarily unavailable right now. You can keep exploring the verified story timeline and try again in a moment.");
}

function companionHealthPayload(twinEnv) {
  if (!twinEnv.hasUsableApiKey) {
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

function twinApiPlugin() {
  return {
    name: "ricon-twin-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      const twinEnv = normalizeTwinEnv(env);
      if (!twinEnv.hasUsableApiKey) {
        warnTwinEnv("ANTHROPIC_API_KEY is missing or invalid. /api/twin will use safe local fallback replies in development.");
      }

      server.middlewares.use("/api/twin/health", (req, res) => {
        if (req.method !== "GET") {
          writeError(res, 405, "Method not allowed. Use GET to fetch companion health.");
          return;
        }
        try {
          writeJson(res, 200, companionHealthPayload(twinEnv));
        } catch {
          writeJson(res, 503, {
            status: "unavailable",
            reason: "health-check-failed",
            message: "Companion status is temporarily unavailable."
          });
        }
      });

      server.middlewares.use("/api/twin", async (req, res) => {
        if (req.method !== "POST") {
          writeError(res, 405, "Method not allowed. Use POST to generate a Digital Twin response.");
          return;
        }

        try {
          const body = await readJson(req);
          const { athlete, system, messages } = body;

          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          res.setHeader("X-Accel-Buffering", "no");

          if (!twinEnv.hasUsableApiKey) {
            res.setHeader("X-RICON-Companion-Fallback", "env-missing");
            await writeFallbackStream(res, fallbackTwinReply(athlete, messages));
            return;
          }

          const upstream = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": twinEnv.apiKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: twinEnv.model,
              max_tokens: 1000,
              stream: true,
              system,
              messages
            })
          });

          if ((upstream.status === 401 || upstream.status === 403) && athlete) {
            warnTwinEnv("Anthropic credentials were rejected. Falling back to local development companion replies.");
            res.setHeader("X-RICON-Companion-Fallback", "auth-invalid");
            await writeFallbackStream(res, fallbackTwinReply(athlete, messages));
            return;
          }

          if (!upstream.ok || !upstream.body) {
            const data = await upstream.json().catch(() => ({}));
            if (upstream.status >= 500) {
              writeUnavailableError(res);
              return;
            }
            writeError(res, upstream.status, data.error?.message || "The Digital Twin provider rejected the request.");
            return;
          }

          const reader = upstream.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() || "";

            for (const event of events) {
              const dataLine = event.split("\n").find((line) => line.startsWith("data: "));
              if (!dataLine) continue;
              const data = JSON.parse(dataLine.slice(6));
              const text = data.type === "content_block_delta" && data.delta?.type === "text_delta" ? data.delta.text : "";
              if (text) res.write(text);
            }
          }
          res.end();
        } catch (error) {
          writeError(res, 500, error.message || "Unable to stream the Digital Twin response.");
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), twinApiPlugin()]
});
