import React from "react";

const cardBase = {
  border: "1px solid rgba(201,168,76,0.24)",
  background: "linear-gradient(145deg,rgba(16,16,16,0.94),rgba(8,8,8,0.94))",
  borderRadius: 2,
  padding: "16px 18px",
  boxShadow: "0 0 0 1px rgba(255,255,255,0.02) inset"
};

const titleStyle = {
  fontFamily: "\"Inter\",sans-serif",
  fontSize: 9,
  letterSpacing: 2,
  color: "#C9A84C",
  marginBottom: 8
};

const bodyStyle = {
  fontSize: 14,
  lineHeight: 1.6,
  color: "rgba(240,235,227,0.72)"
};

export function RetryAction({ label = "TRY AGAIN", onRetry, disabled = false, ariaLabel }) {
  return (
    <button
      type="button"
      className="proof-btn mono"
      onClick={onRetry}
      disabled={disabled}
      aria-label={ariaLabel || label}
      style={{
        fontSize: 8,
        letterSpacing: 2,
        padding: "8px 12px",
        color: disabled ? "#555" : "#C9A84C",
        background: "transparent",
        border: "1px solid rgba(201,168,76,0.35)",
        cursor: disabled ? "not-allowed" : "pointer"
      }}
    >
      {label}
    </button>
  );
}

export function LoadingState({
  label = "Loading",
  message = "Preparing your next verified chapter.",
  role = "status"
}) {
  return (
    <div style={cardBase} role={role} aria-live="polite" aria-label={label}>
      <div style={titleStyle}>{label.toUpperCase()}</div>
      <div className="cormorant" style={bodyStyle}>{message}</div>
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  message,
  action = null,
  ariaLabel = "Empty state"
}) {
  return (
    <div style={cardBase} role="status" aria-live="polite" aria-label={ariaLabel}>
      <div style={titleStyle}>RICON ARCHIVE</div>
      <div className="cormorant" style={{ ...bodyStyle, fontSize: 20, marginBottom: 8 }}>{title}</div>
      {message && <div style={bodyStyle}>{message}</div>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Service unavailable",
  message = "Please try again in a moment.",
  action = null,
  ariaLabel = "Error state"
}) {
  return (
    <div
      style={{
        ...cardBase,
        border: "1px solid rgba(201,168,76,0.32)",
        background: "linear-gradient(140deg,rgba(36,24,14,0.55),rgba(8,8,8,0.95))"
      }}
      role="alert"
      aria-live="assertive"
      aria-label={ariaLabel}
    >
      <div style={titleStyle}>COMPANION UPDATE</div>
      <div className="cormorant" style={{ ...bodyStyle, fontSize: 20, marginBottom: 8 }}>{title}</div>
      <div style={bodyStyle}>{message}</div>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
