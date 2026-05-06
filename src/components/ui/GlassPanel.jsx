import "./ui.css";
import { cx } from "./utils.js";

export default function GlassPanel({
  as: Component = "div",
  padding = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={cx("ui-glass-panel", `ui-pad-${padding}`, className)} {...props}>
      {children}
    </Component>
  );
}
