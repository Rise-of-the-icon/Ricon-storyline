import { DEFAULT_SUBSCRIPTION_PLAN } from "../../types/ricon";

export default function SelectTwinSummary({ twin, onContinue, continuing }) {
  const plan = DEFAULT_SUBSCRIPTION_PLAN;
  const hasSelection = Boolean(twin);

  return (
    <aside className="select-twin-summary" aria-labelledby="select-twin-summary-title">
      <div className="select-twin-summary-inner">
        <h2 id="select-twin-summary-title" className="select-twin-summary-title">
          Your selection
        </h2>

        <div className="select-twin-summary-row">
          <span className="select-twin-summary-label">Twin</span>
          <span className="select-twin-summary-value">
            {hasSelection ? twin.name : "None selected"}
          </span>
        </div>

        <div className="select-twin-summary-row">
          <span className="select-twin-summary-label">Plan</span>
          <span className="select-twin-summary-value">{plan.planName}</span>
        </div>

        <div className="select-twin-summary-row">
          <span className="select-twin-summary-label">Price</span>
          <span className="select-twin-summary-value select-twin-summary-price">
            ${plan.price.toFixed(2)}/{plan.billingInterval}
          </span>
        </div>

        {plan.trialEnabled && (
          <div className="select-twin-summary-trial">
            <span aria-hidden="true">◉ </span>
            {plan.sessionsIncluded} sessions included · Trial enabled
          </div>
        )}

        <p className="select-twin-summary-copy">
          Subscribe monthly. Cancel anytime. Full access to every verified digital twin.
        </p>

        <button
          type="button"
          className="primary-button premium-button auth-submit select-twin-continue"
          onClick={onContinue}
          disabled={!hasSelection || continuing}
        >
          {continuing ? "Continuing…" : "Continue to payment"}
        </button>
      </div>
    </aside>
  );
}
