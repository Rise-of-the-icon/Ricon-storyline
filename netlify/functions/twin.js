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

function streamFromText(text) {
  const words = text.split(/(\s+)/);
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for (const word of words) {
        controller.enqueue(encoder.encode(word));
        await new Promise((resolve) => setTimeout(resolve, /\s+/.test(word) ? 8 : 34));
      }
      controller.close();
    }
  });
}

async function streamAnthropic({ system, messages, signal }) {
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 1000,
      stream: true,
      system,
      messages
    })
  });

  if (!upstream.ok || !upstream.body) {
    const data = await upstream.json().catch(() => ({}));
    return new Response(data.error?.message || "The Digital Twin provider rejected the request.", {
      status: upstream.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
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
          if (text) controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no"
    }
  });
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed. Use POST to generate a Digital Twin response.", { status: 405 });
  }

  try {
    const body = await request.json();
    const { athlete, system, messages } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(streamFromText(fallbackTwinReply(athlete, messages)), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform"
        }
      });
    }

    return streamAnthropic({ system, messages, signal: request.signal });
  } catch (error) {
    return new Response(error.message || "Unable to stream the Digital Twin response.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
