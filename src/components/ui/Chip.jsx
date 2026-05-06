import "./ui.css";
import { cx } from "./utils.js";

export default function Chip({
  as: Component = "button",
  selected = false,
  className = "",
  children,
  disabled = false,
  type,
  ...props
}) {
  const isButton = Component === "button";
  return (
    <Component
      className={cx("ui-chip", selected && "ui-chip-selected", className)}
      aria-pressed={isButton ? selected : undefined}
      disabled={isButton ? disabled : undefined}
      aria-disabled={!isButton && disabled ? "true" : undefined}
      type={isButton ? (type || "button") : undefined}
      {...props}
    >
      {children}
    </Component>
  );
}
