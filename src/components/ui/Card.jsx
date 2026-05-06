import "./ui.css";
import { cx } from "./utils.js";

export default function Card({
  as: Component = "div",
  variant = "default",
  padding = "md",
  interactive = false,
  className = "",
  children,
  ...props
}) {
  return (
    <Component
      className={cx("ui-card", `ui-card-${variant}`, `ui-pad-${padding}`, interactive && "ui-card-interactive", className)}
      {...props}
    >
      {children}
    </Component>
  );
}
