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
    const prompt = `You are narrating your own legacy for a fan experiencing your verified story for the first time. Open with a powerful, cinematic first-person statement — who you are, what year defined you, what you were built for. Draw from at least one specific documented moment. Be emotionally resonant and concise.`;
    apiHistory.current = [{ role: "user", content: prompt }];
    try {
      const reply = await fetchTwin(apiHistory.current);
      apiHistory.current.push({ role: "assistant", content: reply });
      setMessages([{ role: "assistant", content: reply }]);
    } catch { setError("Unable to reach the Digital Twin. Please try again."); }
    setLoading(false);
  };

  const continueNarrator = async () => {
    setLoading(true); setError(null);
    const prompt = "Continue the story. Speak about a different defining chapter — a turning point that changed everything that followed. Draw from a specific documented moment.";
    apiHistory.current.push({ role: "user", content: prompt });
    try {
      const reply = await fetchTwin(apiHistory.current);
      apiHistory.current.push({ role: "assistant", content: reply });
      setMessages(p => [...p, { role: "assistant", content: reply }]);
    } catch { setError("Unable to reach the Digital Twin. Please try again."); }
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
    } catch { setError("Unable to reach the Digital Twin. Please try again."); }
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
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(4,4,4,0.97)", backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", animation: "fadeIn 0.35s ease" }}>
      <div className="scanline-fx" />

      <div style={{ padding: "22px 36px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
        <div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: 3, color: "#7BC8E8", marginBottom: 4 }}>◉ DIGITAL TWIN · VERIFIED DATA</div>
          <div className="bebas" style={{ fontSize: 26, letterSpacing: 4, color: "#F0EBE3" }}>{athlete.name}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 2, background: "#111", padding: 2, borderRadius: 3 }}>
          {["narrator","qa"].map(m => (
            <button key={m} onClick={() => switchMode(m)}
              className={mode === m ? "mode-btn-active" : ""}
              style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, padding: "8px 16px", border: "none", borderRadius: 2, cursor: "pointer", background: mode === m ? "#C9A84C" : "transparent", color: mode === m ? "#080808" : "#555", transition: "all 0.2s" }}>
              {m === "narrator" ? "▶ NARRATOR" : "✦ Q&A"}
            </button>
          ))}
        </div>
        <button onClick={onClose}
          style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, color: "#444", background: "none", border: "1px solid #1e1e1e", padding: "8px 14px", cursor: "pointer", borderRadius: 2, transition: "color 0.2s" }}
          onMouseEnter={e => e.target.style.color="#888"} onMouseLeave={e => e.target.style.color="#444"}>
          CLOSE ✕
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 18px", gap: 22 }}>
          <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="ring-b" style={{ position: "absolute", inset: -22, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.18)" }} />
            <div className="ring-a" style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.42)" }} />
            <div className="ring-a" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(201,168,76,0.7)" }} />
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,#18180e 0%,#0a0a06 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: loading ? "0 0 36px rgba(201,168,76,0.45)" : "0 0 18px rgba(201,168,76,0.12)", transition: "box-shadow 0.5s" }}>
              <span className="bebas" style={{ fontSize: 34, letterSpacing: 3, color: "#C9A84C" }}>{athlete.initials}</span>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: loading ? "#7BC8E8" : "#C9A84C", marginBottom: 6 }}>
              {loading ? "◉ SPEAKING..." : "● READY"}
            </div>
            <div className="mono" style={{ fontSize: 8, letterSpacing: 1, color: "#2a2a2a" }}>VERIFIED TWIN v1.0</div>
          </div>
          <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
            {athlete.stats.slice(0,2).map((s,i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div className="bebas" style={{ fontSize: 22, letterSpacing: 2, color: "#C9A84C" }}>{s.v}</div>
                <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#3a3a3a" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>
            {messages.length === 0 && !loading && !error && (
              <div style={{ textAlign: "center", paddingTop: 80 }}>
                <div className="cormorant" style={{ fontStyle: "italic", fontSize: 22, color: "rgba(240,235,227,0.18)", marginBottom: 12 }}>
                  {mode === "narrator" ? "Preparing the story..." : "Ask anything."}
                </div>
                {mode === "qa" && <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: "#2a2a2a" }}>THE TWIN RESPONDS ONLY WITH VERIFIED FACTS.</div>}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 30, animation: "fadeUp 0.5s ease" }}>
                {msg.role === "user" ? (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ maxWidth: "58%", padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
                      <div style={{ fontSize: 14, color: "rgba(240,235,227,0.65)", lineHeight: 1.65 }}>{msg.content}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(201,168,76,0.05)" }}>
                      <span className="bebas" style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 1 }}>{athlete.initials}</span>
                    </div>
                    <div style={{ flex: 1, paddingTop: 2 }}>
                      <div className="cormorant" style={{ fontStyle: "italic", fontSize: 19, color: "#F0EBE3", lineHeight: 1.75 }}>{msg.content}</div>
                      <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#2e2e2e", marginTop: 10 }}>✓ VERIFIED TWIN RESPONSE</div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start", animation: "fadeIn 0.3s ease" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(201,168,76,0.05)" }}>
                  <span className="bebas" style={{ fontSize: 11, color: "#C9A84C" }}>{athlete.initials}</span>
                </div>
                <div style={{ display: "flex", gap: 7, alignItems: "center", paddingTop: 10 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#C9A84C", animation: `dot 1.4s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mono" style={{ padding: "14px 18px", background: "rgba(255,70,70,0.07)", border: "1px solid rgba(255,70,70,0.2)", color: "rgba(255,150,150,0.8)", fontSize: 10, borderRadius: 2 }}>{error}</div>
            )}

            <div ref={bottomRef} />
          </div>

          {mode === "qa" ? (
            <div style={{ padding: "20px 36px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 10 }}>
              <input className="twin-input" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendQA())}
                placeholder={`Ask ${athlete.name.split(" ")[0]} anything...`}
                disabled={loading}
                style={{ flex: 1, background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)", color: "#F0EBE3", padding: "13px 18px", fontFamily: '"DM Sans"', fontSize: 14, borderRadius: 2, transition: "border-color 0.2s" }} />
              <button onClick={sendQA} disabled={loading || !input.trim()}
                style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "13px 22px", background: loading || !input.trim() ? "#161616" : "#C9A84C", color: loading || !input.trim() ? "#3a3a3a" : "#080808", border: "none", borderRadius: 2, cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                SEND →
              </button>
            </div>
          ) : (
            messages.length > 0 && !loading && (
              <div style={{ padding: "20px 36px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="twin-btn" onClick={continueNarrator}
                  style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: "#7BC8E8", border: "1px solid rgba(123,200,232,0.3)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>
                  ▶ CONTINUE THE STORY
                </button>
                <button className="twin-btn" onClick={() => switchMode("qa")}
                  style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>
                  ✦ SWITCH TO Q&A
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
