import "./ui.css";
import { cx } from "./utils.js";

export default function Surface({
  as: Component = "div",
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={cx("ui-surface", `ui-surface-${variant}`, `ui-pad-${padding}`, className)} {...props}>
      {children}
    </Component>
  );
}
