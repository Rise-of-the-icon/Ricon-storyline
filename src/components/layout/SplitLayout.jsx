import "./layout.css";
import { cx } from "../ui/utils.js";

export default function SplitLayout({
  as: Component = "div",
  variant = "default",
  primary = "1fr",
  secondary = "1fr",
  gap,
  align = "stretch",
  reverseMobile = false,
  className = "",
  children,
  style,
  ...props
}) {
  const splitStyle = {
    "--layout-split-primary": primary,
    "--layout-split-secondary": secondary,
    "--layout-split-align": align,
    ...(gap ? { "--layout-split-gap": gap } : null),
    ...style,
  };

  return (
    <Component
      className={cx(
        "layout-split",
        variant !== "default" && `layout-split-${variant}`,
        reverseMobile && "layout-split-reverse-mobile",
        className
      )}
      style={splitStyle}
      {...props}
    >
      {children}
    </Component>
  );
}
