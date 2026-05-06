import "./ui.css";
import { cx } from "./utils.js";

export default function Skeleton({
  className = "",
  width = "100%",
  height = "1rem",
  label = "Loading",
  ...props
}) {
  return (
    <span
      className={cx("ui-skeleton", className)}
      role="status"
      aria-label={label}
      style={{ width, height, display: "block", ...props.style }}
      {...props}
    />
  );
}
