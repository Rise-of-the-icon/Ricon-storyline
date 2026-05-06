import "./layout.css";
import { cx } from "../ui/utils.js";

export default function Container({
  as: Component = "div",
  size = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={cx("layout-container", `layout-container-${size}`, className)} {...props}>
      {children}
    </Component>
  );
}
