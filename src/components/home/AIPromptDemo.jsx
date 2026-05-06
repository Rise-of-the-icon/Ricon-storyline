import { useEffect, useMemo, useState } from "react";
import "./AIPromptDemo.css";

const promptResponses = {
  "Why was this moment legendary?": {
    body: "Because it compressed an entire legacy into one possession: defensive read, controlled pace, clean isolation, and a title-winning release. The highlight shows the shot. The story is how prepared he was for the pressure before the ball ever left his hand.",
    tags: ["Legacy", "Clutch", "Verified Context"],
  },
  "What happened right before this?": {
    body: "Before the jumper, Jordan stripped Karl Malone on the previous Utah possession. That defensive action gave Chicago the ball and turned a one-point deficit into a final chance to close the dynasty.",
    tags: ["Timeline", "Setup", "Game Context"],
  },
  "Compare this to another NBA clutch moment.": {
    body: "Compared with other clutch shots, this one carries unusual finality. It was not just a game-winner. It became the closing frame for a six-title run, which gives the moment cultural weight beyond the scoreboard.",
    tags: ["Comparison", "NBA", "Cultural Weight"],
  },
  "What music defined this era?": {
    body: "Late-90s basketball culture moved with arena anthems, Chicago house echoes, hip-hop's mainstream rise, and the commercial polish of global sports marketing. A RICON music layer would connect the clip to that broader soundtrack.",
    tags: ["Music", "Era", "Culture"],
  },
  "Show me the cultural impact.": {
    body: "The Last Shot became a universal shorthand for finishing the job: posters, commercials, documentaries, sneaker mythology, and fan memory all reused the image as proof of Jordan's control over the biggest stage.",
    tags: ["Culture", "Artifacts", "Story Branches"],
  },
};

const prompts = Object.keys(promptResponses);

export function PromptPill({ prompt, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`ai-prompt-pill ${selected ? "ai-prompt-pill-selected" : ""}`}
      onClick={() => onSelect(prompt)}
      aria-pressed={selected}
    >
      {prompt}
    </button>
  );
}

export function MockAIResponseCard({ prompt, response, thinking }) {
  return (
    <div className="mock-ai-response-card" role="region" aria-label="Mock AI Story Guide response">
      <div className="mock-ai-response-header">
        <div>
          <div className="mock-ai-response-kicker">AI Story Guide · Demo Mode</div>
          <h3 className="mock-ai-response-prompt">{prompt}</h3>
        </div>
        <div className="mock-ai-response-status" role="status" aria-live="polite">
          <span className="mock-ai-response-dot" aria-hidden="true" />
          {thinking ? "Thinking" : "Grounded"}
        </div>
      </div>

      <div className="mock-ai-response-body" aria-live="polite">
        {thinking ? (
          <div className="mock-ai-response-skeleton" aria-label="Generating mock response">
            <span className="mock-ai-response-line" />
            <span className="mock-ai-response-line" />
            <span className="mock-ai-response-line" />
          </div>
        ) : (
          <p>{response.body}</p>
        )}
      </div>

      <div className="mock-ai-response-meta" aria-label="Mock response context">
        {(thinking ? ["Reading Timeline", "Checking Sources"] : response.tags).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

export default function AIPromptDemo() {
  const [selectedPrompt, setSelectedPrompt] = useState(prompts[0]);
  const [thinking, setThinking] = useState(false);
  const response = useMemo(() => promptResponses[selectedPrompt] || promptResponses[prompts[0]], [selectedPrompt]);

  const selectPrompt = (prompt) => {
    if (prompt === selectedPrompt && !thinking) return;
    setSelectedPrompt(prompt);
    setThinking(true);
  };

  useEffect(() => {
    if (!thinking) return undefined;
    const id = window.setTimeout(() => setThinking(false), 520);
    return () => window.clearTimeout(id);
  }, [thinking, selectedPrompt]);

  return (
    <section className="ai-prompt-demo" aria-labelledby="ai-prompt-demo-title">
      <div className="ai-prompt-demo-inner">
        <div>
          <div className="ai-prompt-demo-eyebrow">AI Story Guide Preview</div>
          <h2 id="ai-prompt-demo-title" className="ai-prompt-demo-title">
            Ask the story what the highlight reel leaves out.
          </h2>
          <p className="ai-prompt-demo-copy">
            This is a mocked product interaction: prompt the guide, see source-aware context, and imagine every moment becoming searchable, comparable, and culturally connected.
          </p>
          <div className="ai-prompt-pill-list" aria-label="Example AI prompts">
            {prompts.map((prompt) => (
              <PromptPill
                key={prompt}
                prompt={prompt}
                selected={prompt === selectedPrompt}
                onSelect={selectPrompt}
              />
            ))}
          </div>
        </div>

        <MockAIResponseCard prompt={selectedPrompt} response={response} thinking={thinking} />
      </div>
    </section>
  );
}
