import "./ui.css";
import { cx } from "./utils.js";

export default function Badge({
  as: Component = "span",
  variant = "neutral",
  size = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={cx("ui-badge", `ui-badge-${variant}`, `ui-badge-${size}`, className)} {...props}>
      {children}
    </Component>
  );
}
