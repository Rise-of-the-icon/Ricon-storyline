import { Link } from "react-router-dom";
import { getSourceReferencesByIds } from "../../data/coreFacts.ts";

export default function ChatSessionBar({
  sessionsRemaining,
  sessionsIncluded,
  usageLabel,
  activeSession,
  endedSession,
  isExhausted,
  onEndSession,
  onStartAnotherSession,
  twinName,
  endDisabled = false,
}) {
  const recapSources = endedSession
    ? getSourceReferencesByIds(endedSession.sourceIdsReferenced)
    : [];

  if (isExhausted) {
    return (
      <div className="chat-session-bar chat-session-exhausted" role="status">
        <div className="chat-session-copy">
          <div className="chat-session-title">No sessions remaining this month</div>
          <p className="chat-session-meta">
            Your Storyline Access plan includes {sessionsIncluded} verified chat sessions per month
            across every digital twin.
            Sessions renew at the start of each billing cycle.
          </p>
        </div>
        <div className="chat-session-actions">
          <Link to="/feed" className="secondary-button">
            View content drops
          </Link>
          <Link to="/subscribe" className="primary-button premium-button">
            Manage subscription
          </Link>
        </div>
      </div>
    );
  }

  if (endedSession) {
    return (
      <div className="chat-session-bar chat-session-recap" role="region" aria-label="Session recap">
        <div className="chat-session-copy">
          <div className="chat-session-kicker">Session ended</div>
          <div className="chat-session-title">Your conversation with {twinName} is complete</div>
          <div className="chat-session-stats">
            <div className="chat-session-stat">
              <span className="chat-session-stat-value">{endedSession.messageCount}</span>
              <span className="chat-session-stat-label">Messages exchanged</span>
            </div>
            <div className="chat-session-stat">
              <span className="chat-session-stat-value">{recapSources.length}</span>
              <span className="chat-session-stat-label">Sources referenced</span>
            </div>
          </div>
          {recapSources.length > 0 && (
            <ul className="chat-session-sources">
              {recapSources.map((source) => (
                <li key={source.id}>
                  <span aria-hidden="true">✓ </span>
                  {source.label}
                  {source.year ? ` · ${source.year}` : ""}
                </li>
              ))}
            </ul>
          )}
          <p className="chat-session-meta">{usageLabel}</p>
        </div>
        <div className="chat-session-actions">
          {sessionsRemaining > 0 ? (
            <button type="button" className="primary-button premium-button" onClick={onStartAnotherSession}>
              Start another session
            </button>
          ) : (
            <>
              <Link to="/feed" className="secondary-button">
                View content drops
              </Link>
              <Link to="/subscribe" className="primary-button premium-button">
                Manage subscription
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-session-bar" role="status">
      <div className="chat-session-copy">
        <div className="chat-session-title">{usageLabel}</div>
        <p className="chat-session-meta">
          {activeSession
            ? "Session in progress · Your first message started this session"
            : "Send a message to begin your next verified twin session"}
        </p>
      </div>
      {activeSession && (
        <button
          type="button"
          className="secondary-button chat-session-end-button"
          onClick={onEndSession}
          disabled={endDisabled}
        >
          End session
        </button>
      )}
    </div>
  );
}
