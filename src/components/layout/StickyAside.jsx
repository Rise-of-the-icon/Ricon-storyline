import "./layout.css";
import { cx } from "../ui/utils.js";

export default function StickyAside({
  as: Component = "aside",
  top,
  className = "",
  innerClassName = "",
  children,
  style,
  ...props
}) {
  return (
    <Component className={cx("layout-sticky-aside", className)} style={style} {...props}>
      <div
        className={cx("layout-sticky-aside-inner", innerClassName)}
        style={top ? { "--layout-sticky-top": top } : undefined}
      >
        {children}
      </div>
    </Component>
  );
}
