import "./ui.css";
import Button from "./Button.jsx";
import Surface from "./Surface.jsx";
import { cx } from "./utils.js";

export default function EmptyState({
  eyebrow = "RICON ARCHIVE",
  title = "Nothing here yet",
  message,
  action,
  actionLabel,
  onAction,
  className = "",
  ...props
}) {
  const renderedAction = action || (actionLabel ? <Button variant="secondary" onClick={onAction}>{actionLabel}</Button> : null);
  return (
    <Surface className={cx("ui-state", className)} variant="subtle" role="status" aria-live="polite" {...props}>
      {eyebrow && <div className="type-label" style={{ color: "var(--color-teal)" }}>{eyebrow}</div>}
      <div className="ui-state-title type-heading-md">{title}</div>
      {message && <div className="ui-state-message type-body-md">{message}</div>}
      {renderedAction && <div className="ui-state-actions">{renderedAction}</div>}
    </Surface>
  );
}
