import "./ui.css";
import { cx } from "./utils.js";

export default function IconButton({
  as: Component = "button",
  variant = "ghost",
  size = "md",
  className = "",
  children,
  label,
  disabled = false,
  type,
  ...props
}) {
  const isButton = Component === "button";
  return (
    <Component
      className={cx("ui-icon-button", `ui-button-${variant}`, `ui-icon-button-${size}`, className)}
      aria-label={label}
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
