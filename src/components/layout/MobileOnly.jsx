import "./layout.css";
import { cx } from "../ui/utils.js";

export default function MobileOnly({
  as: Component = "div",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={cx("layout-mobile-only", className)} {...props}>
      {children}
    </Component>
  );
}
