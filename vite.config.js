import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

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

function twinApiPlugin() {
  return {
    name: "ricon-twin-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");

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

          if (!env.ANTHROPIC_API_KEY) {
            await writeFallbackStream(res, fallbackTwinReply(athlete, messages));
            return;
          }

          const upstream = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
              max_tokens: 1000,
              stream: true,
              system,
              messages
            })
          });

          if (!upstream.ok || !upstream.body) {
            const data = await upstream.json().catch(() => ({}));
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
