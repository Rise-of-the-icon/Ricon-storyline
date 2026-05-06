import "./layout.css";
import { cx } from "../ui/utils.js";

export default function DesktopOnly({
  as: Component = "div",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={cx("layout-desktop-only", className)} {...props}>
      {children}
    </Component>
  );
}
