import "./ui.css";
import { cx } from "./utils.js";

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled = false,
  type,
  ...props
}) {
  const isButton = Component === "button";
  return (
    <Component
      className={cx("ui-button", `ui-button-${variant}`, `ui-button-${size}`, className)}
      disabled={isButton ? disabled : undefined}
      aria-disabled={!isButton && disabled ? "true" : undefined}
      tabIndex={!isButton && disabled ? -1 : props.tabIndex}
      type={isButton ? (type || "button") : undefined}
      {...props}
    >
      {children}
    </Component>
  );
}
