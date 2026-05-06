import { useEffect, useMemo, useRef, useState } from "react";
import { resolveMockAIResponse } from "../../data/ai/mockResponses";
import "./AIStoryGuide.css";

const categoryForMoment = (moment) => {
  const kind = moment?.kind || "";
  if (["draft", "return", "retirement"].includes(kind)) return "Career";
  if (["championship", "iconic"].includes(kind)) return "Game";
  if (["record"].includes(kind)) return "Stats";
  if (["release", "performance", "collaboration"].includes(kind)) return "Music";
  if (["cultural"].includes(kind)) return "Culture";
  return "Legacy";
};

function responseFor({ prompt, question, activeMoment }) {
  const response = resolveMockAIResponse({
    promptId: prompt?.id,
    question,
    category: categoryForMoment(activeMoment),
  });
  return {
    title: response.statusLabel || "Demo response",
    body: response.response,
    chips: response.chips || [],
    jumpMomentId: response.relatedMomentId,
    responseType: response.type,
  };
}

export default function AIStoryGuide({
  story,
  activeMoment,
  suggestedPrompts = [],
  onJumpToMoment,
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const [voiceNoticeOpen, setVoiceNoticeOpen] = useState(false);
  const launcherRef = useRef(null);
  const closeRef = useRef(null);
  const prompts = useMemo(() => (
    suggestedPrompts.length ? suggestedPrompts : [
      { id: "why", label: "Why does this matter?", prompt: `Why does ${activeMoment?.title || "this moment"} matter?` },
      { id: "before", label: "What happened before?", prompt: "What happened right before this?" },
      { id: "impact", label: "Show cultural impact", prompt: "Show me the cultural impact." },
    ]
  ), [activeMoment?.title, suggestedPrompts]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus?.();
  }, [open]);

  const close = () => {
    setOpen(false);
    window.setTimeout(() => launcherRef.current?.focus?.(), 0);
  };

  const ask = (prompt) => {
    const question = typeof prompt === "string" ? prompt : prompt?.prompt;
    if (!question) {
      setError("Choose a prompt or type a question first.");
      return;
    }
    setError("");
    setMessages((current) => [...current, { role: "user", content: question }]);
    setThinking(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { role: "assistant", ...responseFor({ prompt: typeof prompt === "string" ? null : prompt, question, story, activeMoment }) }]);
      setThinking(false);
    }, 520);
  };

  const submit = (event) => {
    event.preventDefault();
    const question = input.trim();
    setInput("");
    ask(question);
  };

  if (!open) {
    return (
      <div className="ai-story-guide">
        <button ref={launcherRef} type="button" className="ai-story-guide-launcher" onClick={() => setOpen(true)}>
          <span aria-hidden="true">✦</span>
          Ask AI Guide
        </button>
      </div>
    );
  }

  return (
    <div className="ai-story-guide">
      <section className="ai-story-guide-panel" role="dialog" aria-label="AI Story Guide">
        <div className="ai-story-guide-header">
          <div>
            <div className="ai-story-guide-kicker">AI Story Guide · Mocked</div>
            <h2 className="ai-story-guide-title">{activeMoment?.title || story?.title || "Story Guide"}</h2>
          </div>
          <button ref={closeRef} type="button" className="ai-story-guide-close" onClick={close} aria-label="Close AI Story Guide">×</button>
        </div>

        <div className="ai-story-guide-body">
          {!messages.length && !thinking && (
            <div className="ai-story-guide-welcome">
              <strong>Ask inside the verified story layer.</strong>
              <p>Use a suggested prompt or type a question about this moment. This demo is local and does not call an API.</p>
            </div>
          )}

          <div className="ai-story-guide-prompts" aria-label="Suggested AI prompts">
            {prompts.slice(0, 4).map((prompt) => (
              <button key={prompt.id || prompt.label} type="button" className="ai-story-guide-prompt" onClick={() => ask(prompt)}>
                {prompt.label || prompt.prompt}
              </button>
            ))}
          </div>

          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={message.role === "user" ? "ai-story-guide-message ai-story-guide-message-user" : "ai-story-guide-response"}>
              <strong>{message.role === "user" ? "You" : message.title}</strong>
              <p>{message.content || message.body}</p>
              {message.chips?.length > 0 && (
                <div className="ai-story-guide-chips" aria-label="Response chips">
                  {message.chips.map((chip) => <span key={chip}>{chip}</span>)}
                </div>
              )}
              {message.jumpMomentId && (
                <button type="button" className="ai-story-guide-jump" onClick={() => onJumpToMoment?.(message.jumpMomentId)}>
                  Jump to moment
                </button>
              )}
            </div>
          ))}

          {thinking && (
            <div className="ai-story-guide-response" role="status" aria-live="polite">
              <strong>Thinking</strong>
              <div className="ai-story-guide-thinking" aria-label="Generating mocked answer">
                <span /><span /><span />
              </div>
            </div>
          )}

          {error && <div className="ai-story-guide-error" role="alert"><p>{error}</p></div>}
        </div>

        <form className="ai-story-guide-composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="ai-story-guide-input">Ask the AI Story Guide</label>
          <input id="ai-story-guide-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about this moment..." />
          <button
            type="button"
            className="ai-story-guide-voice"
            onClick={() => setVoiceNoticeOpen((value) => !value)}
            aria-label="Voice input placeholder. Voice input coming soon."
            aria-expanded={voiceNoticeOpen}
            aria-controls="ai-story-guide-voice-notice"
          >
            <span aria-hidden="true">◌</span>
            Voice
          </button>
          <button type="submit">Send</button>
        </form>
        {voiceNoticeOpen && (
          <div id="ai-story-guide-voice-notice" className="ai-story-guide-voice-notice" role="status">
            Voice input coming soon. This demo does not record audio or convert speech to text yet.
          </div>
        )}
      </section>
    </div>
  );
}
