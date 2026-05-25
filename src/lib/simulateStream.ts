export interface StreamOptions {
  /** Delay before the first chunk (ms). Capped by caller for POC SLA. */
  thinkingMs?: number;
  /** Delay between chunks (ms). */
  chunkDelayMs?: number;
  onThinking?: () => void;
  onStart?: () => void;
  onChunk: (partialText: string) => void;
  onComplete: (fullText: string) => void;
  signal?: { aborted: boolean };
}

function splitIntoChunks(text: string): string[] {
  const words = text.match(/\S+\s*/g) ?? [text];
  const chunks: string[] = [];
  let buffer = "";

  for (const word of words) {
    buffer += word;
    if (buffer.length >= 4 || word.endsWith(".") || word.endsWith("?") || word.endsWith("!")) {
      chunks.push(buffer);
      buffer = "";
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}

function wait(ms: number, signal?: { aborted: boolean }): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(() => {
      if (signal?.aborted) reject(new DOMException("Aborted", "AbortError"));
      else resolve();
    }, ms);
    if (signal) {
      const check = window.setInterval(() => {
        if (signal.aborted) {
          window.clearTimeout(timer);
          window.clearInterval(check);
          reject(new DOMException("Aborted", "AbortError"));
        }
      }, 40);
    }
  });
}

export async function simulateTextStream(text: string, options: StreamOptions): Promise<string> {
  const {
    thinkingMs = 900,
    chunkDelayMs = 38,
    onThinking,
    onStart,
    onChunk,
    onComplete,
    signal,
  } = options;

  onThinking?.();
  await wait(thinkingMs, signal);

  const chunks = splitIntoChunks(text);
  let partial = "";
  let started = false;

  for (const chunk of chunks) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (!started) {
      onStart?.();
      started = true;
    }
    partial += chunk;
    onChunk(partial);
    await wait(chunkDelayMs + Math.floor(Math.random() * 24), signal);
  }

  onComplete(text);
  return text;
}
