import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FlowSteps from "./FlowSteps";
import { validateSignUpFields } from "../../lib/validateSignUp";
import { signUpAndPersistUser } from "../../lib/storage";
import { appendRedirectParam, resolveSignupGuardRedirect } from "../../lib/fanExperience";
import FanRouteRedirect from "../routing/FanRouteRedirect";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
      <path d="M13.016 9.54c-.02-2.083 1.703-3.078 1.78-3.126-0.969-1.415-2.478-1.61-3.013-1.631-1.283-0.13-2.507 0.756-3.157 0.756-0.65 0-1.653-0.737-2.718-0.718-1.4 0.02-2.69 0.814-3.41 2.068-1.455 2.524-0.373 6.26 1.045 8.31 0.693 1.001 1.518 2.124 2.6 2.084 1.045-0.042 1.44-0.675 2.703-0.675 1.262 0 1.617 0.675 2.718 0.655 1.122-0.02 1.832-1.022 2.518-2.028 0.792-1.157 1.118-2.28 1.137-2.338-0.025-0.01-2.188-0.84-2.208-3.333zM10.865 2.97c0.772-0.934 1.292-2.23 1.15-3.52-1.112 0.045-2.458 0.742-3.258 1.676-0.715 0.828-1.34 2.155-1.172 3.428 1.24 0.096 2.508-0.63 3.28-1.584z" />
    </svg>
  );
}

export default function SignUpScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const existingUserRedirect = resolveSignupGuardRedirect(redirectTarget);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const completeSignUp = (userInput) => {
    signUpAndPersistUser(userInput);
    navigate(appendRedirectParam("/select-twin", redirectTarget), { replace: true });
  };

  if (existingUserRedirect) {
    return <FanRouteRedirect to={existingUserRedirect} />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");

    const nextErrors = validateSignUpFields({ name, email, password });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    window.setTimeout(() => {
      try {
        completeSignUp({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          authProvider: "email",
        });
      } catch {
        setFormError("Something went wrong. Please try again.");
        setSubmitting(false);
      }
    }, 320);
  };

  const handleSocialSignUp = (provider) => {
    setFormError("");
    setSubmitting(true);
    window.setTimeout(() => {
      const suffix = provider === "google" ? "google" : "apple";
      completeSignUp({
        name: provider === "google" ? "Google Fan" : "Apple Fan",
        email: `fan.${suffix}.poc@ricon.demo`,
        authProvider: provider,
      });
    }, 420);
  };

  const handleBlur = (field) => {
    const nextErrors = validateSignUpFields({ name, email, password });
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
    <div className="animate-page-enter auth-page">
      <nav className="app-nav" aria-label="Sign up">
        <Link to="/" className="ghost-button auth-back-link">
          <span aria-hidden="true">← </span>Browse
        </Link>
        <div className="nav-divider" />
        <span className="brand-mark">RICON</span>
        <div className="nav-divider" />
        <span className="brand-submark">Storyline</span>
        <div className="nav-spacer" />
        <div className="status-pill">Fan Experience · Step 1 of 3</div>
      </nav>

      <main className="auth-main">
        <div className="auth-layout">
          <section className="auth-copy-panel" aria-labelledby="signup-title">
            <FlowSteps currentStep={1} />
            <p className="auth-kicker">Verified digital twins</p>
            <h1 id="signup-title" className="auth-title">
              Create your fan account
            </h1>
            <ul className="auth-trust-list">
              <li>Access every verified digital twin</li>
              <li>Subscribe monthly. Cancel anytime.</li>
              <li>Every response grounded in documented truth</li>
            </ul>
          </section>

          <section className="auth-card" aria-labelledby="signup-form-title">
            <h2 id="signup-form-title" className="auth-card-title">
              Start your journey
            </h2>
            <p className="auth-card-copy">
              Join RICON Storyline for full digital twin access and verified legacy conversations.
            </p>

            {formError && (
              <div className="form-banner-error" role="alert">
                {formError}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-field">
                <label className="form-label" htmlFor="signup-name">
                  Full name
                </label>
                <input
                  id="signup-name"
                  className={errors.name ? "form-input has-error" : "form-input"}
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur("name")}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "signup-name-error" : undefined}
                  placeholder="Your name"
                  disabled={submitting}
                />
                {errors.name && (
                  <p id="signup-name-error" className="form-error" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="signup-email">
                  Email
                </label>
                <input
                  id="signup-email"
                  className={errors.email ? "form-input has-error" : "form-input"}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "signup-email-error" : undefined}
                  placeholder="you@email.com"
                  disabled={submitting}
                />
                {errors.email && (
                  <p id="signup-email-error" className="form-error" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="signup-password">
                  Password
                </label>
                <input
                  id="signup-password"
                  className={errors.password ? "form-input has-error" : "form-input"}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "signup-password-error" : undefined}
                  placeholder="At least 8 characters"
                  disabled={submitting}
                />
                {errors.password && (
                  <p id="signup-password-error" className="form-error" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <button type="submit" className="primary-button premium-button auth-submit" disabled={submitting}>
                {submitting ? "Creating account…" : "Continue"}
              </button>
            </form>

            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            <div className="auth-social-row">
              <button
                type="button"
                className="social-button"
                onClick={() => handleSocialSignUp("google")}
                disabled={submitting}
              >
                <GoogleIcon />
                Google
              </button>
              <button
                type="button"
                className="social-button social-button-apple"
                onClick={() => handleSocialSignUp("apple")}
                disabled={submitting}
              >
                <AppleIcon />
                Apple
              </button>
            </div>

            <p className="auth-footer-copy">
              Already have an account?{" "}
              <Link to="/signin" className="auth-inline-link">
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
