import "./ui.css";
import { cx } from "./utils.js";

export default function Section({
  as: Component = "section",
  spacing = "default",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={cx("ui-section", spacing !== "default" && `ui-section-${spacing}`, className)} {...props}>
      {children}
    </Component>
  );
}
