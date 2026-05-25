import { Navigate, useLocation } from "react-router-dom";
import { resolveFanHomeGuardRedirect } from "../../lib/fanExperience";
import FanRouteRedirect from "../routing/FanRouteRedirect";

/** Legacy route — subscribed fans land on the fan home dashboard. */
export default function SubscriptionSuccessScreen() {
  const location = useLocation();
  const guardRedirect = resolveFanHomeGuardRedirect();

  if (guardRedirect) {
    return <FanRouteRedirect to={guardRedirect} />;
  }

  return <Navigate to="/fan/home?welcome=1" replace state={location.state} />;
}
