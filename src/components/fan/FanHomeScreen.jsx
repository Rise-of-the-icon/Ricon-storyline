import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  getActiveChatSession,
  getAllContentDrops,
  getSessionUsageSummary,
  markSubscriptionComplete,
} from "../../lib/storage";
import { loadConversationMessages } from "../../lib/conversationStorage";
import { getFanNotifications, markNotificationRead } from "../../lib/notificationStorage";
import { formatDropType, formatPublishedDate, getPublishedDropsSorted } from "../../lib/contentDropFeed";
import {
  appendRedirectParam,
  getFanExperienceSnapshot,
  resolveFanHomeGuardRedirect,
} from "../../lib/fanExperience";
import ContentDropDetailModal from "../feed/ContentDropDetailModal";
import FanNotificationBell from "../notifications/FanNotificationBell";
import FanRouteRedirect from "../routing/FanRouteRedirect";

function truncateText(text, max = 140) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function formatMessageTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function roleLabel(role) {
  if (role === "user") return "You";
  if (role === "twin") return "Twin";
  return "System";
}

export default function FanHomeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const guardRedirect = resolveFanHomeGuardRedirect();
  const snapshot = getFanExperienceSnapshot();
  const welcome = searchParams.get("welcome") === "1";
  const [selectedDrop, setSelectedDrop] = useState(null);
  const [showWelcome, setShowWelcome] = useState(welcome);

  useEffect(() => {
    if (!welcome || !snapshot.subscription) return;
    markSubscriptionComplete(snapshot.subscription);
    setSearchParams({}, { replace: true });
  }, [welcome, snapshot.subscription, setSearchParams]);

  if (guardRedirect) {
    const redirectPath = `${location.pathname}${location.search}`;
    const destination =
      guardRedirect === "/signup"
        ? appendRedirectParam("/signup", redirectPath)
        : guardRedirect;
    return <FanRouteRedirect to={destination} />;
  }

  const { user, subscription, subscribedTwin: twin } = snapshot;
  if (!user || !subscription || !twin) {
    return <FanRouteRedirect to="/signup" />;
  }

  const sessionUsage = getSessionUsageSummary(user.id, twin.id);
  const activeSession = getActiveChatSession(user.id, twin.id);
  const recentDrops = getPublishedDropsSorted(twin.id).slice(0, 3);
  const twinDraftCount = getAllContentDrops().filter(
    (drop) => drop.twinId === twin.id && drop.status !== "published"
  ).length;
  const previewMessages = loadConversationMessages(user.id, twin.id).slice(-3);
  const notifications = getFanNotifications().slice(0, 4);
  const unreadCount = notifications.filter((item) => !item.read).length;
  const chatHref = `/legend/${twin.id}?openTwin=qa`;
  const sessionProgress = Math.max(
    0,
    Math.min(
      100,
      (sessionUsage.sessionsRemaining / Math.max(sessionUsage.sessionsIncluded, 1)) * 100
    )
  );
  const isTrialing = subscription.status === "trialing";

  const handleOpenNotification = (notification) => {
    markNotificationRead(notification.id);
    navigate(`/feed?dropId=${encodeURIComponent(notification.dropId)}`);
  };

  return (
    <div className="animate-page-enter fan-home-page">
      <nav className="app-nav sticky" aria-label="Your Storyline home">
        <Link to="/" className="ghost-button auth-back-link">
          <span aria-hidden="true">← </span>Browse
        </Link>
        <div className="nav-divider" />
        <span className="brand-mark">RICON</span>
        <div className="nav-divider" />
        <span className="brand-submark">Your Storyline</span>
        <div className="nav-spacer" />
        <FanNotificationBell />
        <Link to="/feed" className="ghost-button">
          Content Drops
        </Link>
      </nav>

      <main className="fan-home-main">
        {showWelcome && (
          <section className="fan-home-welcome" aria-label="Subscription welcome">
            <div>
              <p className="fan-home-welcome-kicker">Subscription active</p>
              <h2 className="fan-home-welcome-title">Welcome back, {user.name.split(" ")[0]}</h2>
              <p className="fan-home-welcome-copy">
                Your verified twin is ready. Start a conversation or catch up on the latest drops.
              </p>
            </div>
            <button
              type="button"
              className="ghost-button fan-home-welcome-dismiss"
              onClick={() => setShowWelcome(false)}
            >
              Dismiss
            </button>
          </section>
        )}

        <header className="fan-home-header">
          <p className="auth-kicker">Subscriber home</p>
          <h1 className="fan-home-title">Your Storyline</h1>
          <p className="fan-home-lead">
            Everything connected — chat, verified drops, and your monthly sessions in one place.
          </p>
        </header>

        <section className="fan-home-hero-grid" aria-label="Twin and subscription overview">
          <article className="fan-home-twin-card">
            {twin.image ? (
              <div className="fan-home-twin-avatar-wrap">
                <img className="fan-home-twin-avatar" src={twin.image} alt="" />
              </div>
            ) : (
              <div className="fan-home-twin-avatar-wrap fan-home-twin-avatar-fallback" aria-hidden="true">
                {twin.name.slice(0, 1)}
              </div>
            )}

            <div className="fan-home-twin-body">
              <p className="fan-home-twin-label">Home twin</p>
              <h2 className="fan-home-twin-name">{twin.name}</h2>
              <p className="fan-home-twin-meta">
                {twin.sportOrIndustry} · {twin.yearsActive}
              </p>
              <p className="fan-home-twin-copy">{twin.shortDescription}</p>
              <Link to={`/legend/${twin.id}`} className="fan-home-inline-link">
                View twin story
                <span aria-hidden="true"> →</span>
              </Link>
            </div>
          </article>

          <aside className="fan-home-status-card" aria-label="Subscription status">
            <div className="fan-home-status-row">
              <span className="fan-home-status-label">Plan</span>
              <span className="fan-home-status-value">{subscription.planName}</span>
            </div>
            <div className="fan-home-status-row">
              <span className="fan-home-status-label">Status</span>
              <span className="fan-home-status-value fan-home-status-active">
                {isTrialing ? "Trialing" : "Active"}
              </span>
            </div>
            <div className="fan-home-status-row">
              <span className="fan-home-status-label">Price</span>
              <span className="fan-home-status-value">
                {isTrialing ? (
                  <>Free trial · then ${subscription.price.toFixed(2)}/mo</>
                ) : (
                  <>${subscription.price.toFixed(2)}/month</>
                )}
              </span>
            </div>

            <div className="fan-home-session-block">
              <div className="fan-home-session-top">
                <span className="fan-home-status-label">Sessions remaining</span>
                <span className="fan-home-session-count">
                  {sessionUsage.sessionsRemaining}
                  <span className="fan-home-session-total"> / {sessionUsage.sessionsIncluded}</span>
                </span>
              </div>
              <div
                className="fan-home-session-meter"
                role="progressbar"
                aria-valuenow={sessionUsage.sessionsRemaining}
                aria-valuemin={0}
                aria-valuemax={sessionUsage.sessionsIncluded}
                aria-label={sessionUsage.label}
              >
                <span className="fan-home-session-meter-fill" style={{ width: `${sessionProgress}%` }} />
              </div>
              <p className="fan-home-session-copy">{sessionUsage.label}</p>
              {activeSession && (
                <p className="fan-home-session-active">Session in progress — pick up where you left off.</p>
              )}
            </div>
          </aside>
        </section>

        <section className="fan-home-actions" aria-label="Primary actions">
          <Link to={chatHref} className="primary-button premium-button cta-glow">
            <span aria-hidden="true">◉ </span>
            Start Conversation
          </Link>
          <Link to="/feed" className="secondary-button">
            <span aria-hidden="true">✦ </span>
            View Content Drops
          </Link>
        </section>

        <div className="fan-home-panels">
          <section className="fan-home-panel" aria-labelledby="fan-home-drops-title">
            <div className="fan-home-panel-heading">
              <h2 id="fan-home-drops-title" className="section-kicker">
                RECENT DROPS
              </h2>
              <Link to="/feed" className="fan-home-inline-link">
                View all
                <span aria-hidden="true"> →</span>
              </Link>
            </div>

            {recentDrops.length === 0 ? (
              <div className="fan-home-empty">
                <p>No published drops yet for your twin.</p>
                {twinDraftCount > 0 && (
                  <p className="feed-empty-note">
                    {twinDraftCount} draft or approved {twinDraftCount === 1 ? "drop is" : "drops are"}{" "}
                    saved locally and hidden until published.
                  </p>
                )}
                <Link to="/feed" className="secondary-button">
                  Open feed
                </Link>
              </div>
            ) : (
              <ul className="fan-home-drop-list">
                {recentDrops.map((drop) => (
                  <li key={drop.id}>
                    <button type="button" className="fan-home-drop-item" onClick={() => setSelectedDrop(drop)}>
                      <div className="fan-home-drop-top">
                        <span className="feed-type-pill">{formatDropType(drop.type)}</span>
                        <span className="fan-home-drop-date">{formatPublishedDate(drop.publishedAt)}</span>
                      </div>
                      <span className="fan-home-drop-title">{drop.title}</span>
                      <span className="fan-home-drop-summary">{drop.summary}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="fan-home-panel" aria-labelledby="fan-home-chat-title">
            <div className="fan-home-panel-heading">
              <h2 id="fan-home-chat-title" className="section-kicker">
                RECENT CONVERSATION
              </h2>
              {previewMessages.length > 0 && (
                <Link to={chatHref} className="fan-home-inline-link">
                  Continue
                  <span aria-hidden="true"> →</span>
                </Link>
              )}
            </div>

            {previewMessages.length === 0 ? (
              <div className="fan-home-empty">
                <p>No messages yet. Start your first verified conversation.</p>
                <Link to={chatHref} className="primary-button premium-button">
                  Start Conversation
                </Link>
              </div>
            ) : (
              <ul className="fan-home-chat-list">
                {previewMessages.map((message) => (
                  <li key={message.id} className={`fan-home-chat-item fan-home-chat-item-${message.role}`}>
                    <div className="fan-home-chat-meta">
                      <span className="fan-home-chat-role">{roleLabel(message.role)}</span>
                      <time className="fan-home-chat-time" dateTime={message.createdAt}>
                        {formatMessageTime(message.createdAt)}
                      </time>
                    </div>
                    <p className="fan-home-chat-content">{truncateText(message.content)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="fan-home-panel" aria-labelledby="fan-home-notifications-title">
            <div className="fan-home-panel-heading">
              <h2 id="fan-home-notifications-title" className="section-kicker">
                NOTIFICATIONS
              </h2>
              {unreadCount > 0 && (
                <span className="fan-home-unread-pill">{unreadCount} unread</span>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="fan-home-empty">
                <p>Drop alerts will appear here when new content is published.</p>
              </div>
            ) : (
              <ul className="fan-home-notification-list">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={
                        notification.read
                          ? "fan-home-notification-item is-read"
                          : "fan-home-notification-item"
                      }
                      onClick={() => handleOpenNotification(notification)}
                    >
                      <span className="fan-home-notification-title">{notification.title}</span>
                      <span className="fan-home-notification-message">{notification.message}</span>
                      <span className="fan-home-notification-time">
                        {formatMessageTime(notification.createdAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      {selectedDrop && (
        <ContentDropDetailModal
          drop={selectedDrop}
          twinName={twin.name}
          askTwinHref={chatHref}
          askTwinLabel="Ask the twin about this"
          onClose={() => setSelectedDrop(null)}
        />
      )}
    </div>
  );
}
