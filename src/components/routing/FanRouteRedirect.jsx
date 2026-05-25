import { Navigate } from "react-router-dom";

export default function FanRouteRedirect({ to, replace = true }) {
  if (!to) return null;
  return <Navigate to={to} replace={replace} />;
}
