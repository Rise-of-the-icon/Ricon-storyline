import "./layout.css";
import { cx } from "../ui/utils.js";

export default function Page({
  as: Component = "div",
  variant = "default",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={cx("layout-page", `layout-page-${variant}`, className)} {...props}>
      {children}
    </Component>
  );
}
