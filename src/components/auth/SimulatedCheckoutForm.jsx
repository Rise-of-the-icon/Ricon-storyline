import { useState } from "react";
import {
  formatCardNumber,
  formatExpiration,
  validateCheckoutFields,
} from "../../lib/validateCheckout";

export default function SimulatedCheckoutForm({ onSubmit, loading, formError }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiration, setExpiration] = useState("");
  const [cvc, setCvc] = useState("");
  const [zip, setZip] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateCheckoutFields({ cardNumber, expiration, cvc, zip });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit();
  };

  const handleBlur = (field) => {
    const nextErrors = validateCheckoutFields({ cardNumber, expiration, cvc, zip });
    if (nextErrors[field]) {
      setErrors((current) => ({ ...current, [field]: nextErrors[field] }));
    } else {
      setErrors((current) => {
        const updated = { ...current };
        delete updated[field];
        return updated;
      });
    }
  };

  return (
    <div className="checkout-form-wrap">
      <div className="checkout-demo-banner" role="note">
        <span className="checkout-demo-icon" aria-hidden="true">◉</span>
        <div>
          <strong>Investor demo checkout</strong>
          <p>Simulated Stripe-style payment. No real charges. Use test card below.</p>
        </div>
      </div>

      {formError && (
        <div className="form-banner-error" role="alert">
          {formError}
        </div>
      )}

      <form className="checkout-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label className="form-label" htmlFor="checkout-card">
            Card number
          </label>
          <input
            id="checkout-card"
            className={errors.cardNumber ? "form-input has-error checkout-input" : "form-input checkout-input"}
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            onBlur={() => handleBlur("cardNumber")}
            disabled={loading}
            aria-invalid={Boolean(errors.cardNumber)}
            aria-describedby={errors.cardNumber ? "checkout-card-error" : "checkout-card-hint"}
          />
          <p id="checkout-card-hint" className="checkout-hint">
            Test card: <code>4242 4242 4242 4242</code> · Any future expiry · Any CVC
          </p>
          {errors.cardNumber && (
            <p id="checkout-card-error" className="form-error" role="alert">
              {errors.cardNumber}
            </p>
          )}
        </div>

        <div className="checkout-row">
          <div className="form-field">
            <label className="form-label" htmlFor="checkout-exp">
              Expiration
            </label>
            <input
              id="checkout-exp"
              className={errors.expiration ? "form-input has-error checkout-input" : "form-input checkout-input"}
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={expiration}
              onChange={(e) => setExpiration(formatExpiration(e.target.value))}
              onBlur={() => handleBlur("expiration")}
              disabled={loading}
              aria-invalid={Boolean(errors.expiration)}
            />
            {errors.expiration && (
              <p className="form-error" role="alert">
                {errors.expiration}
              </p>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="checkout-cvc">
              CVC
            </label>
            <input
              id="checkout-cvc"
              className={errors.cvc ? "form-input has-error checkout-input" : "form-input checkout-input"}
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onBlur={() => handleBlur("cvc")}
              disabled={loading}
              aria-invalid={Boolean(errors.cvc)}
            />
            {errors.cvc && (
              <p className="form-error" role="alert">
                {errors.cvc}
              </p>
            )}
          </div>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="checkout-zip">
            ZIP code
          </label>
          <input
            id="checkout-zip"
            className={errors.zip ? "form-input has-error checkout-input" : "form-input checkout-input"}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="10001"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 10))}
            onBlur={() => handleBlur("zip")}
            disabled={loading}
            aria-invalid={Boolean(errors.zip)}
          />
          {errors.zip && (
            <p className="form-error" role="alert">
              {errors.zip}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="primary-button premium-button auth-submit checkout-pay-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="checkout-spinner" aria-hidden="true" />
              Processing…
            </>
          ) : (
            "Complete checkout"
          )}
        </button>
      </form>
    </div>
  );
}
