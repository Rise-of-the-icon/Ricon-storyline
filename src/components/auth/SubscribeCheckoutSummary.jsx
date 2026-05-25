import { Link } from "react-router-dom";
import { DEFAULT_SUBSCRIPTION_PLAN } from "../../types/ricon";

export default function SubscribeCheckoutSummary({
  twin,
  startTrial,
  onTrialChange,
  checkoutLoading,
}) {
  const plan = DEFAULT_SUBSCRIPTION_PLAN;

  return (
    <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
      <div className="checkout-summary-inner">
        <h2 id="checkout-summary-title" className="checkout-summary-title">
          Order summary
        </h2>

        {twin?.image && (
          <div className="checkout-twin-preview">
            <img className="checkout-twin-avatar" src={twin.image} alt="" />
            <div>
              <div className="checkout-twin-name">{twin.name}</div>
              <div className="checkout-twin-meta">
                {twin.sportOrIndustry} · {twin.yearsActive}
              </div>
            </div>
          </div>
        )}

        <div className="checkout-summary-row">
          <span className="checkout-summary-label">Plan</span>
          <span className="checkout-summary-value">{plan.planName}</span>
        </div>

        <div className="checkout-summary-row">
          <span className="checkout-summary-label">Price</span>
          <span className="checkout-summary-value checkout-summary-price">
            ${plan.price.toFixed(2)}/month
          </span>
        </div>

        <div className="checkout-summary-row">
          <span className="checkout-summary-label">Billing</span>
          <span className="checkout-summary-value">Monthly</span>
        </div>

        <label className="checkout-trial-toggle">
          <input
            type="checkbox"
            checked={startTrial}
            onChange={(e) => onTrialChange(e.target.checked)}
            disabled={checkoutLoading}
          />
          <span className="checkout-trial-copy">
            <strong>Start with free trial</strong>
            <small>{plan.sessionsIncluded} twin sessions included before billing</small>
          </span>
        </label>

        <p className="checkout-cancel-copy">
          Cancel anytime. No long-term commitment. Your subscription unlocks every verified digital twin.
        </p>

        <Link to="/select-twin" className="checkout-change-link">
          ← Change twin
        </Link>
      </div>
    </aside>
  );
}
