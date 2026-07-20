import { useMemo } from "react";
import useTwinEngine from "../twin/useTwinEngine.js";
import { athleteToPack } from "../twin/athleteToPack.js";
import TwinStoryShell from "./twin/TwinStoryShell.jsx";

export {
  OPENING_NARRATIVE_PROMPT,
  prewarmNarratorAudio,
  prewarmOpeningNarrative,
} from "../twin/narratorCore.js";

export default function TwinModal({
  athlete,
  mode,
  onClose,
  onSwitchMode,
  prewarmedNarrative,
  presentation = "modal",
}) {
  const pack = useMemo(() => athleteToPack(athlete), [athlete]);
  const engine = useTwinEngine({ athlete, mode, onClose, onSwitchMode, prewarmedNarrative });
  const isPage = presentation === "page";

  return (
    <div
      ref={engine.modalRef}
      className={isPage ? "modal-root twin-facelift twin-details-page" : "modal-root twin-facelift"}
      role={isPage ? "main" : "dialog"}
      aria-modal={isPage ? undefined : "true"}
      aria-labelledby={engine.titleId}
      aria-describedby={engine.descriptionId}
    >
      <div className="modal-header twin-facelift-header">
        <div>
          <div id={engine.descriptionId} className="modal-status">
            <span aria-hidden="true">◉ </span>Digital Twin · Verified Data
          </div>
          <h2 id={engine.titleId} className="modal-title">{athlete.name}</h2>
        </div>
        <div className="nav-spacer" />
        <button
          ref={engine.closeButtonRef}
          type="button"
          className="close-button"
          onClick={engine.handleClose}
        >
          {isPage ? (
            <><span aria-hidden="true">← </span>Back</>
          ) : (
            <>Close <span aria-hidden="true">✕</span></>
          )}
        </button>
      </div>

      <div className="modal-main twin-facelift-main">
        <TwinStoryShell
          pack={pack}
          mode={mode}
          engine={engine}
          onModeChange={engine.switchMode}
          pageScroll={isPage}
        />
      </div>
    </div>
  );
}
