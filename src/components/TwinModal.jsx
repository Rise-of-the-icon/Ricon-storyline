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

const voicePrompts = [
  { icon: "▣", label: "Relive a defining moment", prompt: "What was your defining moment?" },
  { icon: "◌", label: "Ask about the mindset", prompt: "What mindset separated you from everyone else?" },
  { icon: "◇", label: "Explain the legacy", prompt: "How should people understand your legacy?" },
];

export default function TwinModal({ athlete, mode, onClose, onSwitchMode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeBeat, setActiveBeat] = useState(0);
  const [voiceState, setVoiceState] = useState("idle");
  const narratorIndex = useRef(0);
  const voiceTimer = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const modeRef = useRef(null);
  const figmaTwinMode = new URLSearchParams(window.location.search).get("figmaTwin");

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (voiceTimer.current) window.clearTimeout(voiceTimer.current);
      recognitionRef.current?.abort?.();
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

  const sendQA = async (questionOverride, speakResponse = false) => {
    const question = (questionOverride ?? input).trim();
    if (!question || loading) return;
    const userMsg = { role: "user", content: question };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setLoading(true);
    await wait(700);
    const reply = answerQuestion(athlete, question);
    setMessages(p => [...p, { role: "assistant", content: reply }]);
    setLoading(false);
    if (speakResponse) speakReply(reply);
    else setVoiceState("idle");
  };

  const sendSuggestedPrompt = (prompt) => {
    setVoiceState("idle");
    sendQA(prompt);
  };

  const startVoiceInteraction = () => {
    if (loading || voiceState === "listening" || voiceState === "thinking") return;

    if (voiceState === "speaking") {
      window.speechSynthesis?.cancel();
      setVoiceState("idle");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceState("listening");
    if (voiceTimer.current) window.clearTimeout(voiceTimer.current);

    if (!SpeechRecognition) {
      inputRef.current?.focus();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalTranscript = "";
    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      setInput((finalTranscript || interimTranscript).trim());
    };
    recognition.onerror = () => {
      setVoiceState("idle");
      inputRef.current?.focus();
    };
    recognition.onend = () => {
      const question = finalTranscript.trim();
      recognitionRef.current = null;
      if (!question) {
        setVoiceState("idle");
        return;
      }
      setVoiceState("thinking");
      sendQA(question, true);
    };
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setVoiceState("idle");
      inputRef.current?.focus();
    }
  };

  const stopVoiceInteraction = () => {
    if (voiceTimer.current) window.clearTimeout(voiceTimer.current);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.abort?.();
    }
    recognitionRef.current = null;
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
          <div className="messages">
              {messages.length === 0 && !loading && !voiceIsActive && (
                mode === "qa" ? (
                  <div className="qa-empty-state">
                    <div className="empty-title">Ask {athlete.name.split(" ")[0]} anything.</div>
                    <div className="empty-meta">Verified twin Q&A · Voice optional</div>
                    <div className="voice-prompts compact">
                      {voicePrompts.map(prompt => (
                        <button key={prompt.label} className="voice-chip" onClick={() => sendSuggestedPrompt(prompt.prompt)}>
                          <span>{prompt.icon}</span>
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-title">Preparing the story...</div>
                  </div>
                )
              )}

              {mode === "qa" && voiceIsActive && (
                <div className="voice-status-card">
                  <span className={voiceIsActive ? "live-dot active" : "live-dot"} />
                  {voiceState === "listening" && "Listening. Ask naturally."}
                  {voiceState === "thinking" && "Checking verified records."}
                  {voiceState === "speaking" && "Speaking response."}
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

          {mode === "qa" ? (
            <div className="modal-composer voice-dock">
              <div className="dock-input-wrap">
                <input
                  ref={inputRef}
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
              </button>
              <button
                className={voiceIsActive ? "send-icon-button stop-mode" : "send-icon-button"}
                onClick={voiceIsActive ? stopVoiceInteraction : () => sendQA()}
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
