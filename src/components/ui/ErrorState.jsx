import "./ui.css";
import Button from "./Button.jsx";
import Surface from "./Surface.jsx";
import { cx } from "./utils.js";

export default function ErrorState({
  eyebrow = "COMPANION UPDATE",
  title = "Something went off script",
  message = "Please try again in a moment.",
  action,
  actionLabel = "Try again",
  onRetry,
  className = "",
  ...props
}) {
  const renderedAction = action || (onRetry ? <Button variant="danger" onClick={onRetry}>{actionLabel}</Button> : null);
  return (
    <Surface className={cx("ui-state ui-error", className)} role="alert" aria-live="assertive" {...props}>
      {eyebrow && <div className="type-label" style={{ color: "var(--color-coral)" }}>{eyebrow}</div>}
      <div className="ui-state-title type-heading-md">{title}</div>
      {message && <div className="ui-state-message type-body-md">{message}</div>}
      {renderedAction && <div className="ui-state-actions">{renderedAction}</div>}
    </Surface>
  );
}
