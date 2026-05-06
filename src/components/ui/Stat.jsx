import "./ui.css";
import { cx } from "./utils.js";

export default function Stat({
  label,
  value,
  helper,
  className = "",
  valueClassName = "",
  labelClassName = "",
  ...props
}) {
  return (
    <div className={cx("ui-stat", className)} {...props}>
      <div className={cx("ui-stat-value type-stat", valueClassName)}>{value}</div>
      <div className={cx("ui-stat-label type-label", labelClassName)}>{label}</div>
      {helper && <div className="type-caption ui-stat-label">{helper}</div>}
    </div>
  );
}
