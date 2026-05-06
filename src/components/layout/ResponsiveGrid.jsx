import "./layout.css";
import { cx } from "../ui/utils.js";

export default function ResponsiveGrid({
  as: Component = "div",
  mobile = 1,
  tablet = 2,
  desktop = 3,
  wide = 4,
  gap,
  className = "",
  children,
  style,
  ...props
}) {
  const gridStyle = {
    "--layout-grid-mobile": mobile,
    "--layout-grid-tablet": tablet,
    "--layout-grid-desktop": desktop,
    "--layout-grid-wide": wide,
    ...(gap ? { "--layout-grid-gap": gap } : null),
    ...style,
  };

  return (
    <Component className={cx("layout-responsive-grid", className)} style={gridStyle} {...props}>
      {children}
    </Component>
  );
}
