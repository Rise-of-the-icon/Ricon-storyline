import { Link, useSearchParams } from "react-router-dom";
import { getStoredSubscription, getStoredUser, hasActiveSubscription } from "../../lib/storage";
import { appendRedirectParam, resolvePostAuthDestination } from "../../lib/fanExperience";

export default function SignInScreen() {
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const user = getStoredUser();
  const subscription = getStoredSubscription();
  const isSubscriber = Boolean(user && subscription && hasActiveSubscription(user.id));
  const continueHref = isSubscriber
    ? resolvePostAuthDestination(redirectTarget)
    : appendRedirectParam("/select-twin", redirectTarget);
  const continueLabel = isSubscriber ? "Go to your home" : "Continue to twin selection";

  return (
    <div className="animate-page-enter auth-page">
      <nav className="app-nav" aria-label="Sign in">
        <Link to="/" className="ghost-button auth-back-link">
          <span aria-hidden="true">← </span>Browse
        </Link>
        <div className="nav-divider" />
        <span className="brand-mark">RICON</span>
        <div className="nav-spacer" />
      </nav>

      <main className="auth-main auth-main-centered">
        <section className="auth-card">
          <h1 className="auth-card-title">Sign in</h1>
          {user ? (
            <>
              <p className="auth-card-copy">
                You&apos;re signed in as <strong>{user.name}</strong> ({user.email}).
              </p>
              <Link to={continueHref} className="primary-button premium-button auth-submit">
                {continueLabel}
              </Link>
            </>
          ) : (
            <>
              <p className="auth-card-copy">
                For this POC, create a fan account to get started. Full sign-in arrives in a later release.
              </p>
              <Link
                to={appendRedirectParam("/signup", redirectTarget)}
                className="primary-button premium-button auth-submit"
              >
                Create account
              </Link>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
