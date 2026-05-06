import "./layout.css";
import { cx } from "../ui/utils.js";

export default function Section({
  as: Component = "section",
  spacing = "default",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={cx("layout-section", `layout-section-${spacing}`, className)} {...props}>
      {children}
    </Component>
  );
}
