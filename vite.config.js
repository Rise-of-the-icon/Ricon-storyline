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

function twinApiPlugin() {
  return {
    name: "ricon-twin-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");

      server.middlewares.use("/api/twin", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const body = await readJson(req);
          const { athlete, system, messages } = body;

          if (!env.ANTHROPIC_API_KEY) {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ text: fallbackTwinReply(athlete, messages) }));
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
              system,
              messages
            })
          });

          const data = await upstream.json();
          res.statusCode = upstream.status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            text: data.content?.find((content) => content.type === "text")?.text,
            error: data.error?.message
          }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), twinApiPlugin()]
});
