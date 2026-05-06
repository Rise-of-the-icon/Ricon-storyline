import { useState, useEffect, useRef } from "react";
import { buildSystemPrompt } from "../data/athletes";

export default function TwinModal({ athlete, mode, onClose, onSwitchMode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiHistory = useRef([]);
  const bottomRef = useRef(null);
  const modeRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const fetchTwin = async (history) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: buildSystemPrompt(athlete), messages: history }),
    });
    const data = await res.json();
    return data.content?.find(c => c.type === "text")?.text || "The twin is momentarily silent.";
  };

  const triggerNarrator = async () => {
    setLoading(true); setError(null);
    const prompt = "You are narrating your own legacy for a fan experiencing your verified story for the first time. Open with a powerful, cinematic first-person statement - who you are, what year defined you, what you were built for. Draw from at least one specific documented moment. Be emotionally resonant and concise.";
    apiHistory.current = [{ role: "user", content: prompt }];
    try {
      const reply = await fetchTwin(apiHistory.current);
      apiHistory.current.push({ role: "assistant", content: reply });
      setMessages([{ role: "assistant", content: reply }]);
    } catch {
      setError("Unable to reach the Digital Twin. Please try again.");
    }
    setLoading(false);
  };

  const continueNarrator = async () => {
    setLoading(true); setError(null);
    const prompt = "Continue the story. Speak about a different defining chapter - a turning point that changed everything that followed. Draw from a specific documented moment.";
    apiHistory.current.push({ role: "user", content: prompt });
    try {
      const reply = await fetchTwin(apiHistory.current);
      apiHistory.current.push({ role: "assistant", content: reply });
      setMessages(p => [...p, { role: "assistant", content: reply }]);
    } catch {
      setError("Unable to reach the Digital Twin. Please try again.");
    }
    setLoading(false);
  };

  const sendQA = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    apiHistory.current.push(userMsg);
    setMessages(p => [...p, userMsg]);
    setInput(""); setLoading(true); setError(null);
    try {
      const reply = await fetchTwin(apiHistory.current);
      const assistantMsg = { role: "assistant", content: reply };
      apiHistory.current.push(assistantMsg);
      setMessages(p => [...p, assistantMsg]);
    } catch {
      setError("Unable to reach the Digital Twin. Please try again.");
    }
    setLoading(false);
  };

  const switchMode = (m) => {
    if (m === modeRef.current) return;
    modeRef.current = m;
    apiHistory.current = [];
    setMessages([]); setError(null);
    onSwitchMode(m);
    if (m === "narrator") setTimeout(triggerNarrator, 50);
  };

  useEffect(() => {
    modeRef.current = mode;
    if (mode === "narrator") triggerNarrator();
  }, []);

  return (
    <div className="modal-root">
      <div className="scanline-fx" />

      <div className="modal-header">
        <div>
          <div className="modal-status">◉ Digital Twin · Verified Data</div>
          <div className="modal-title">{athlete.name}</div>
        </div>
        <div className="nav-spacer" />
        <div className="mode-toggle">
          {["narrator", "qa"].map(m => (
            <button key={m} onClick={() => switchMode(m)} className={mode === m ? "mode-button mode-btn-active" : "mode-button"}>
              {m === "narrator" ? "▶ Narrator" : "✦ Q&A"}
            </button>
          ))}
        </div>
        <button className="close-button" onClick={onClose}>Close ✕</button>
      </div>

      <div className="modal-layout">
        <div className="twin-rail">
          <div className="avatar-wrap">
            <div className="avatar-ring outer ring-b" />
            <div className="avatar-ring mid ring-a" />
            <div className="avatar-ring inner ring-a" />
            <div className={loading ? "avatar-core loading" : "avatar-core"}>
              <span className="avatar-initials">{athlete.initials}</span>
            </div>
          </div>
          <div className="twin-state">
            <div className={loading ? "twin-state-label loading" : "twin-state-label"}>
              {loading ? "◉ Speaking..." : "● Ready"}
            </div>
            <div className="twin-version">Verified Twin v1.0</div>
          </div>
          <div className="rail-stats">
            {athlete.stats.slice(0, 2).map((s, i) => (
              <div key={i} className="rail-stat">
                <div className="stat-value">{s.v}</div>
                <div className="stat-label">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-main">
          <div className="messages">
            {messages.length === 0 && !loading && !error && (
              <div className="empty-state">
                <div className="empty-title">
                  {mode === "narrator" ? "Preparing the story..." : "Ask anything."}
                </div>
                {mode === "qa" && <div className="empty-meta">The twin responds only with verified facts.</div>}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className="message">
                {msg.role === "user" ? (
                  <div className="user-message">
                    <div className="user-bubble">{msg.content}</div>
                  </div>
                ) : (
                  <div className="assistant-message">
                    <div className="assistant-avatar">{athlete.initials}</div>
                    <div className="assistant-copy">
                      <div className="assistant-text">{msg.content}</div>
                      <div className="verified-meta">✓ Verified twin response</div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="assistant-message" style={{ animation: "fadeIn 0.3s ease" }}>
                <div className="assistant-avatar">{athlete.initials}</div>
                <div className="typing">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}

            {error && <div className="error-box">{error}</div>}
            <div ref={bottomRef} />
          </div>

          {mode === "qa" ? (
            <div className="modal-composer">
              <input
                className="twin-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendQA())}
                placeholder={`Ask ${athlete.name.split(" ")[0]} anything...`}
                disabled={loading}
              />
              <button className="primary-button" onClick={sendQA} disabled={loading || !input.trim()}>
                Send →
              </button>
            </div>
          ) : (
            messages.length > 0 && !loading && (
              <div className="modal-composer narrator-actions">
                <button className="secondary-button" onClick={continueNarrator}>
                  ▶ Continue the story
                </button>
                <button className="secondary-button" onClick={() => switchMode("qa")}>
                  ✦ Switch to Q&A
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
