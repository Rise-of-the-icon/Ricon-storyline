import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FlowSteps from "./FlowSteps";
import SubscribeCheckoutSummary from "./SubscribeCheckoutSummary";
import SimulatedCheckoutForm from "./SimulatedCheckoutForm";
import { getTwinById } from "../../data/twins";
import {
  appendRedirectParam,
  getValidSelectedTwinId,
  resolveSubscribeGuardRedirect,
  sanitizeRedirectPath,
} from "../../lib/fanExperience";
import { completePocCheckout, getStoredUser } from "../../lib/storage";
import FanRouteRedirect from "../routing/FanRouteRedirect";
import { simulateCheckoutDelay } from "../../lib/validateCheckout";
import { DEFAULT_SUBSCRIPTION_PLAN } from "../../types/ricon";

export default function SubscribeScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const guardRedirect = resolveSubscribeGuardRedirect();
  const user = getStoredUser();
  const twinId = getValidSelectedTwinId();
  const twin = twinId ? getTwinById(twinId) : undefined;
  const [startTrial, setStartTrial] = useState(DEFAULT_SUBSCRIPTION_PLAN.trialEnabled);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [formError, setFormError] = useState("");

  if (guardRedirect) {
    const destination =
      guardRedirect === "/signup"
        ? appendRedirectParam("/signup", redirectTarget ?? "/subscribe")
        : guardRedirect;
    return <FanRouteRedirect to={destination} />;
  }

  if (!user || !twinId || !twin) {
    return <FanRouteRedirect to="/select-twin" />;
  }

  const handleCheckout = async () => {
    setFormError("");
    setCheckoutLoading(true);

    try {
      await simulateCheckoutDelay();
      completePocCheckout(user.id, twin.id, { startTrial });
      const safeRedirect = sanitizeRedirectPath(redirectTarget);
      navigate(safeRedirect ?? "/fan/home?welcome=1", {
        replace: true,
        state: { startTrial },
      });
    } catch {
      setFormError("Checkout failed. Please verify your card details and try again.");
      setCheckoutLoading(false);
    }
  };

  const backHref = appendRedirectParam("/select-twin", redirectTarget);

  return (
    <div className="animate-page-enter auth-page checkout-page">
      <nav className="app-nav sticky" aria-label="Subscribe">
        <Link to={backHref} className="ghost-button auth-back-link">
          <span aria-hidden="true">← </span>Back
        </Link>
        <div className="nav-divider" />
        <span className="brand-mark">RICON</span>
        <div className="nav-divider" />
        <span className="brand-submark">Storyline</span>
        <div className="nav-spacer" />
        <div className="status-pill">Fan Experience · Step 3 of 3</div>
      </nav>

      <main className="checkout-main">
        <header className="checkout-header">
          <FlowSteps currentStep={3} />
          <p className="auth-kicker">Secure checkout</p>
          <h1 className="auth-title">Confirm your subscription</h1>
          <p className="auth-lead">
            Complete checkout for Storyline Access at{" "}
            <strong>${DEFAULT_SUBSCRIPTION_PLAN.price.toFixed(2)}/month</strong>. Chat with{" "}
            <strong>{twin.name}</strong> and every verified digital twin in the library.
          </p>
        </header>

        <div className="checkout-body">
          <SubscribeCheckoutSummary
            twin={twin}
            startTrial={startTrial}
            onTrialChange={setStartTrial}
            checkoutLoading={checkoutLoading}
          />

          <section className="checkout-payment-panel" aria-labelledby="checkout-payment-title">
            <h2 id="checkout-payment-title" className="checkout-panel-title">
              Payment details
            </h2>
            <SimulatedCheckoutForm
              onSubmit={handleCheckout}
              loading={checkoutLoading}
              formError={formError}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
