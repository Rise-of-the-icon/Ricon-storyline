import "./ui.css";
import { cx } from "./utils.js";

export default function Container({
  as: Component = "div",
  size = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={cx("ui-container", `ui-container-${size}`, className)} {...props}>
      {children}
    </Component>
  );
}
