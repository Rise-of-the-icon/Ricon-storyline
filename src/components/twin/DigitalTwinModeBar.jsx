import React from "react";

/**
 * Compact twin mode switch — lives inside Story Entry, visible in both modes.
 * Mode buttons alone communicate the switch; status copy lives in the chat/story panels.
 */
export default function DigitalTwinModeBar({ talent, mode, onModeChange }) {
  if (!talent.twin?.available) return null;
  const modes = talent.twin.modes || ["narrator", "ask"];

  return (
    <div className="wt-twin-switch" aria-label="Digital twin modes">
      <div className="wt-twin-switch-actions" role="group" aria-label="Twin interaction mode">
        {modes.includes("narrator") && (
          <button
            type="button"
            className={"wt-mode-btn" + (mode === "narrator" ? " active" : "")}
            aria-pressed={mode === "narrator"}
            onClick={() => onModeChange("narrator")}
          >
            {talent.twin.narratorLabel || "Narrator"}
          </button>
        )}
        {modes.includes("ask") && (
          <button
            type="button"
            className={"wt-mode-btn ask-cta" + (mode === "ask" ? " active" : "")}
            aria-pressed={mode === "ask"}
            onClick={() => onModeChange("ask")}
          >
            {talent.twin.askCtaLabel || "Ask a question"}
          </button>
        )}
      </div>
    </div>
  );
}
