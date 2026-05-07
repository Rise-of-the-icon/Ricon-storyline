import { useState, useEffect, useRef } from "react";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const clean = (value) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
const STOP_WORDS = new Set(["what", "when", "where", "your", "were", "with", "that", "this", "from", "about", "moment"]);

const signatureMoment = (athlete) => {
  return [...athlete.moments].reverse().find(moment => moment.type === "iconic" || moment.type === "championship")
    || athlete.moments[athlete.moments.length - 1];
};

const pickMoment = (athlete, query, fallbackIndex = 0) => {
  const q = clean(query);
  const explicitYear = athlete.moments.find(moment => q.includes(moment.y));
  if (explicitYear) return explicitYear;

  if (q.includes("best") || q.includes("biggest") || q.includes("defining") || q.includes("signature")) {
    return signatureMoment(athlete);
  }

  const queryWords = q.split(/\s+/).filter(word => word.length > 3 && !STOP_WORDS.has(word));
  const byWords = athlete.moments.find(moment => {
    const haystack = clean(`${moment.title} ${moment.era} ${moment.type} ${moment.body}`);
    return queryWords.some(word => haystack.includes(word));
  });

  return byWords || athlete.moments[fallbackIndex % athlete.moments.length];
};

const statLine = (athlete) => athlete.stats.map(s => `${s.v} ${s.l}`).join(", ");

const narratorBeats = [
  {
    media: [{ title: "Draft Night Archive", meta: "1984 · Source footage placeholder" }],
    getMoment: (athlete) => athlete.moments[0],
    line: (athlete) => {
      const first = athlete.moments[0];
      const signature = athlete.moments.find(m => m.type === "championship" || m.type === "record") || athlete.moments[1] || first;
      return `I am ${athlete.name}. ${athlete.years} was the arc, but ${first.y} is where the signal first broke through. ${first.body} From there, every season became evidence. ${signature.y}: ${signature.title}. That is one of the moments people use to explain me, because it still carries the weight of what I was built to do.`;
    },
  },
  {
    media: [],
    getMoment: (athlete) => athlete.moments[Math.min(2, athlete.moments.length - 1)],
    line: (athlete) => {
      const turn = athlete.moments[Math.min(2, athlete.moments.length - 1)];
      const title = athlete.moments.find(m => m.type === "championship") || turn;
      return `The turning point was not one play. It was the moment the league understood I could bend the story around me. In ${turn.y}, ${turn.title} became documented proof. Then ${title.y} arrived: ${title.title}. Talent became standard. Standard became pressure. Pressure became legacy.`;
    },
  },
  {
    media: [
      { title: "Final Sequence", meta: "1998 · Broadcast clip placeholder" },
      { title: "Legacy Montage", meta: "Career archive placeholder" },
    ],
    getMoment: (athlete) => athlete.moments[athlete.moments.length - 1],
    line: (athlete) => {
      const final = athlete.moments[athlete.moments.length - 1];
      return `Legacy is what remains after the numbers stop moving. Mine reads like this: ${statLine(athlete)}. But the record only matters because it is attached to lived moments. ${final.y}: ${final.title}. ${final.body} That is the part the archive keeps.`;
    },
  },
];

const buildNarratorMessage = (athlete, beatIndex) => {
  const beat = narratorBeats[beatIndex % narratorBeats.length];
  const moment = beat.getMoment(athlete);
  return {
    role: "assistant",
    content: beat.line(athlete),
    moment,
    media: beat.media,
  };
};

const answerQuestion = (athlete, question) => {
  const q = clean(question);
  const moment = pickMoment(athlete, question, 1);

  if (q.includes("stat") || q.includes("average") || q.includes("ppg") || q.includes("championship") || q.includes("ring")) {
    return `The verified line is ${statLine(athlete)}. I played ${athlete.position} across ${athlete.years}, with ${athlete.teams}. The numbers matter because they point back to documented chapters like ${moment.y}, ${moment.title}.`;
  }

  if (q.includes("team") || q.includes("played for")) {
    return `The verified teams are ${athlete.teams}. That path is part of the story, but the clearest archive marker here is ${moment.y}: ${moment.title}. ${moment.body}`;
  }

  if (q.includes("best") || q.includes("biggest") || q.includes("defining") || q.includes("moment")) {
    return `One defining chapter is ${moment.y}: ${moment.title}. ${moment.body} That is not mythology in this experience. It is one of the verified moments this twin is allowed to speak from.`;
  }

  if (q.includes("who") || q.includes("summary") || q.includes("legacy")) {
    return `I am ${athlete.name}: ${athlete.tagline} The verified record says ${statLine(athlete)}. The story says ${moment.y}, ${moment.title}, because that is where the numbers become memory.`;
  }

  return `That's beyond what I can speak to with certainty, but what I lived and what's documented, I can tell you. In ${moment.y}, ${moment.title}. ${moment.body}`;
};

const qaCaptureMessages = (athlete) => [
  { role: "user", content: "What day is it?" },
  { role: "assistant", content: answerQuestion(athlete, "What day is it?") },
  { role: "user", content: "What about basketball cleats?" },
  { role: "assistant", content: answerQuestion(athlete, "What about basketball cleats?") },
  { role: "user", content: "I love you." },
  { role: "assistant", content: answerQuestion(athlete, "I love you.") },
];

const voiceDemoPrompt = "Tell me about your most defining moment.";
const voicePrompts = [
  { icon: "▣", label: "Relive a defining moment" },
  { icon: "◌", label: "Ask about the mindset" },
  { icon: "◇", label: "Explain the legacy" },
];

export default function TwinModal({ athlete, mode, onClose, onSwitchMode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeBeat, setActiveBeat] = useState(0);
  const [voiceState, setVoiceState] = useState("idle");
  const narratorIndex = useRef(0);
  const voiceTimer = useRef(null);
  const bottomRef = useRef(null);
  const modeRef = useRef(null);
  const figmaTwinMode = new URLSearchParams(window.location.search).get("figmaTwin");

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (voiceTimer.current) window.clearTimeout(voiceTimer.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speakReply = (reply) => {
    if (!("speechSynthesis" in window)) {
      setVoiceState("idle");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.rate = 0.9;
    utterance.pitch = 0.82;
    utterance.volume = 0.9;
    utterance.onstart = () => setVoiceState("speaking");
    utterance.onend = () => setVoiceState("idle");
    utterance.onerror = () => setVoiceState("idle");
    window.speechSynthesis.speak(utterance);
  };

  const triggerNarrator = async () => {
    setLoading(true);
    narratorIndex.current = 0;
    setActiveBeat(0);
    await wait(650);
    setMessages([buildNarratorMessage(athlete, 0)]);
    setLoading(false);
  };

  const continueNarrator = async () => {
    setLoading(true);
    await wait(620);
    const nextIndex = narratorIndex.current >= narratorBeats.length - 1 ? 0 : narratorIndex.current + 1;
    narratorIndex.current = nextIndex;
    setActiveBeat(nextIndex);
    setMessages(p => {
      if (p[nextIndex]) return p;
      return [...p, buildNarratorMessage(athlete, nextIndex)];
    });
    setLoading(false);
  };

  const selectNarratorBeat = async (index) => {
    if (loading) return;
    setActiveBeat(index);
    narratorIndex.current = index;
    if (messages[index]) return;
    setLoading(true);
    await wait(420);
    narratorIndex.current = Math.max(narratorIndex.current, index);
    setMessages(p => {
      const next = [...p];
      for (let i = 0; i <= index; i += 1) {
        if (!next[i]) next[i] = buildNarratorMessage(athlete, i);
      }
      return next;
    });
    setLoading(false);
  };

  const sendQA = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const question = input;
    setMessages(p => [...p, userMsg]);
    setInput("");
    setLoading(true);
    await wait(700);
    const reply = answerQuestion(athlete, question);
    setMessages(p => [...p, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  const startVoiceInteraction = async () => {
    if (loading || voiceState === "listening" || voiceState === "thinking") return;

    if (voiceState === "speaking") {
      window.speechSynthesis?.cancel();
      setVoiceState("idle");
      return;
    }

    setVoiceState("listening");
    if (voiceTimer.current) window.clearTimeout(voiceTimer.current);

    voiceTimer.current = window.setTimeout(async () => {
      const userMsg = { role: "user", content: voiceDemoPrompt };
      setMessages(p => [...p, userMsg]);
      setVoiceState("thinking");
      setLoading(true);
      await wait(650);
      const reply = answerQuestion(athlete, voiceDemoPrompt);
      setMessages(p => [...p, { role: "assistant", content: reply }]);
      setLoading(false);
      speakReply(reply);
    }, 900);
  };

  const stopVoiceInteraction = () => {
    if (voiceTimer.current) window.clearTimeout(voiceTimer.current);
    window.speechSynthesis?.cancel();
    setVoiceState("idle");
    setLoading(false);
  };

  const switchMode = (m) => {
    if (m === modeRef.current) return;
    modeRef.current = m;
    setMessages([]);
    setVoiceState("idle");
    window.speechSynthesis?.cancel();
    onSwitchMode(m);
    if (m === "narrator") setTimeout(triggerNarrator, 50);
  };

  useEffect(() => {
    modeRef.current = mode;
    if (figmaTwinMode === "narrator") {
      narratorIndex.current = narratorBeats.length - 1;
      setActiveBeat(narratorBeats.length - 1);
      setMessages(narratorBeats.map((_, index) => buildNarratorMessage(athlete, index)));
      return;
    }
    if (figmaTwinMode === "qaThread") {
      setMessages(qaCaptureMessages(athlete));
      return;
    }
    if (mode === "narrator") triggerNarrator();
  }, []);

  const showVoiceSurface = mode === "qa" && (messages.length === 0 || voiceState !== "idle");
  const voiceIsActive = voiceState === "listening" || voiceState === "thinking" || voiceState === "speaking";

  return (
    <div className="modal-root">
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
              {athlete.headshot && (
                <img className="avatar-headshot" src={athlete.headshot} alt={`${athlete.name} headshot`} />
              )}
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
          {showVoiceSurface ? (
            <div className={`voice-mode-surface ${voiceIsActive ? "active" : ""}`}>
              <div className="voice-mode-title">
                <span>{athlete.name.split(" ")[0]}</span> Voice
              </div>
              <div className="voice-live-status">
                <span className={voiceIsActive ? "live-dot active" : "live-dot"} />
                {voiceState === "idle" && "Ready"}
                {voiceState === "listening" && "Listening"}
                {voiceState === "thinking" && "Thinking"}
                {voiceState === "speaking" && "Speaking"}
              </div>

              {!voiceIsActive ? (
                <div className="voice-prompts">
                  <div className="voice-prompts-title">Ideas to get started</div>
                  {voicePrompts.map(prompt => (
                    <button key={prompt.label} className="voice-chip" onClick={startVoiceInteraction}>
                      <span>{prompt.icon}</span>
                      {prompt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="voice-active-panel">
                  <div className="voice-active-title">
                    {voiceState === "listening" && "Go ahead. I am listening."}
                    {voiceState === "thinking" && "Checking the verified record."}
                    {voiceState === "speaking" && "Speaking as the verified twin."}
                  </div>
                  <div className="voice-active-wave">
                    {Array.from({ length: 18 }).map((_, i) => <span key={i} style={{ animationDelay: `${i * 0.045}s` }} />)}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="messages">
              {messages.length === 0 && !loading && (
                <div className="empty-state">
                  <div className="empty-title">Preparing the story...</div>
                </div>
              )}

            {messages.map((msg, i) => (
              <div key={i} className={mode === "narrator" ? "message narrator-beat" : "message"}>
                {msg.role === "user" ? (
                  <div className="user-message">
                    <div className="user-bubble">{msg.content}</div>
                  </div>
                ) : (
                  <div className={mode === "narrator" && i === activeBeat ? "assistant-message narrator-active" : "assistant-message"}>
                    {mode === "narrator" ? (
                      <button className="narrator-marker" onClick={() => selectNarratorBeat(i)} aria-label={`Play chapter ${i + 1}`}>
                        <span>{msg.moment?.y}</span>
                      </button>
                    ) : (
                      <div className="assistant-avatar">{athlete.initials}</div>
                    )}
                    <div className="assistant-copy">
                      {mode === "narrator" && (
                        <button className="narrator-chapter" onClick={() => selectNarratorBeat(i)}>
                          <span>{msg.moment?.era}</span>
                          {msg.moment?.title}
                        </button>
                      )}
                      <div className="assistant-text">{msg.content}</div>
                      <div className="verified-meta">✓ Verified twin response</div>
                      {mode === "narrator" && msg.media?.length > 0 && (
                        <div className="narrator-media-row">
                          {msg.media.map((item, mediaIndex) => (
                            <button key={mediaIndex} className="video-card" aria-label={`Play ${item.title}`}>
                              <span className="video-play">▶</span>
                              <span className="video-copy">
                                <span>{item.title}</span>
                                <small>{item.meta}</small>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
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

            <div ref={bottomRef} />
            </div>
          )}

          {mode === "qa" ? (
            <div className="modal-composer voice-dock">
              <div className="dock-input-wrap">
                <input
                  className="twin-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendQA())}
                  placeholder={`Ask ${athlete.name.split(" ")[0]}...`}
                  disabled={loading}
                />
              </div>
              <button
                className={`voice-button ${voiceState}`}
                onClick={startVoiceInteraction}
                disabled={loading && voiceState !== "speaking"}
                aria-label={voiceState === "speaking" ? "Stop voice playback" : "Start voice interaction"}
              >
                <span>{voiceState === "speaking" ? "■" : "🎙"}</span>
                {voiceState === "idle" && (
                  <span className="voice-button-bars">
                    {[0, 1, 2].map(i => <i key={i} style={{ animationDelay: `${i * 0.11}s` }} />)}
                  </span>
                )}
              </button>
              <button
                className={voiceIsActive ? "send-icon-button stop-mode" : "send-icon-button"}
                onClick={voiceIsActive ? stopVoiceInteraction : sendQA}
                disabled={!voiceIsActive && (loading || !input.trim())}
                aria-label={voiceIsActive ? "Exit voice mode" : "Send message"}
              >
                {voiceIsActive ? "×" : "→"}
              </button>
            </div>
          ) : (
            messages.length > 0 && !loading && (
              <div className="modal-composer narrator-actions">
                <button className="secondary-button" onClick={continueNarrator}>
                  ▶ {activeBeat >= narratorBeats.length - 1 ? "Restart story" : "Continue the story"}
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
