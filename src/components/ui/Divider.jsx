import "./ui.css";
import { cx } from "./utils.js";

export default function Divider({
  orientation = "horizontal",
  variant = "default",
  className = "",
  decorative = true,
  ...props
}) {
  return (
    <hr
      className={cx("ui-divider", `ui-divider-${orientation}`, variant !== "default" && `ui-divider-${variant}`, className)}
      aria-hidden={decorative ? "true" : undefined}
      {...props}
    />
  );
}
