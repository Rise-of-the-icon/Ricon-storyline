import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAllContentDrops } from "../../lib/storage";
import {
  appendRedirectParam,
  getFanExperienceSnapshot,
} from "../../lib/fanExperience";
import {
  buildDropChatHref,
  getPublishedDropsSorted,
  partitionDropsByTwin,
} from "../../lib/contentDropFeed";
import { markNotificationsReadForDrop } from "../../lib/notificationStorage";
import { getTwinById } from "../../data/twins";
import ContentDropCard from "./ContentDropCard";
import ContentDropDetailModal from "./ContentDropDetailModal";
import FanNotificationBell from "../notifications/FanNotificationBell";

function resolveAskTwinHref(drop, snapshot) {
  const dropHref = buildDropChatHref(drop);
  if (!snapshot.user) {
    return appendRedirectParam("/signup", dropHref);
  }
  if (!snapshot.isSubscriber) {
    return appendRedirectParam("/select-twin", dropHref);
  }
  return dropHref;
}

function resolveAskTwinLabel(snapshot) {
  if (!snapshot.user) return "Sign up to ask the twin";
  if (!snapshot.isSubscriber) return "Subscribe to ask the twin";
  return "Ask the twin about this";
}

export default function FeedScreen() {
  const snapshot = getFanExperienceSnapshot();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invalidDropNotice, setInvalidDropNotice] = useState(false);
  const isSubscriber = snapshot.isSubscriber;
  const subscribedTwin = snapshot.subscribedTwin;
  const [selectedDrop, setSelectedDrop] = useState(null);

  const allDrops = getPublishedDropsSorted();
  const { twinDrops, otherDrops } =
    isSubscriber && snapshot.subscription?.twinId
      ? partitionDropsByTwin(allDrops, snapshot.subscription.twinId)
      : { twinDrops: [], otherDrops: allDrops };

  const twinDraftCount =
    isSubscriber && snapshot.subscription?.twinId
      ? getAllContentDrops().filter(
          (drop) =>
            drop.twinId === snapshot.subscription.twinId && drop.status !== "published"
        ).length
      : 0;

  const previewDrops = allDrops.slice(0, 8);
  const selectedTwin = selectedDrop ? getTwinById(selectedDrop.twinId) : undefined;

  useEffect(() => {
    const dropId = searchParams.get("dropId");
    if (!dropId) {
      setInvalidDropNotice(false);
      return;
    }

    const drop = getAllContentDrops().find(
      (item) => item.id === dropId && item.status === "published"
    );

    if (drop) {
      setSelectedDrop(drop);
      setInvalidDropNotice(false);
      markNotificationsReadForDrop(dropId);
      return;
    }

    setInvalidDropNotice(true);
    setSelectedDrop(null);
    const params = new URLSearchParams(searchParams);
    params.delete("dropId");
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const renderGrid = (drops, highlighted = false) => (
    <div className="feed-grid">
      {drops.map((drop) => {
        const twin = getTwinById(drop.twinId);
        return (
          <ContentDropCard
            key={drop.id}
            drop={drop}
            twinName={twin?.name ?? "Legend"}
            highlighted={highlighted}
            onOpen={setSelectedDrop}
          />
        );
      })}
    </div>
  );

  return (
    <div className="animate-page-enter feed-page">
      <nav className="app-nav sticky" aria-label="Content drops feed">
        <Link to="/" className="ghost-button auth-back-link">
          <span aria-hidden="true">← </span>Browse
        </Link>
        <div className="nav-divider" />
        <span className="brand-mark">RICON</span>
        <div className="nav-divider" />
        <span className="brand-submark">Feed</span>
        <div className="nav-spacer" />
        {isSubscriber && (
          <Link to="/fan/home" className="ghost-button">
            Your Home
          </Link>
        )}
        <FanNotificationBell />
        {isSubscriber && subscribedTwin ? (
          <Link to={`/legend/${subscribedTwin.id}?openTwin=qa`} className="primary-button premium-button">
            <span aria-hidden="true">◉ </span>
            Start Conversation
          </Link>
        ) : (
          <Link
            to={snapshot.user ? "/select-twin" : appendRedirectParam("/signup", "/feed")}
            className="primary-button premium-button"
          >
            <span aria-hidden="true">◉ </span>
            {snapshot.user ? "Activate Twin Access" : "Sign Up"}
          </Link>
        )}
      </nav>

      <main className="feed-main">
        <header className="feed-header">
          <p className="auth-kicker">{isSubscriber ? "Subscriber feed" : "Preview feed"}</p>
          <h1 className="feed-title">Content Drops</h1>
          <p className="feed-lead">
            {isSubscriber ? (
              <>
                New verified moments and updates for{" "}
                <strong>{subscribedTwin?.name ?? "your twin"}</strong>. Return between sessions
                to see what the talent team has approved.
              </>
            ) : (
              <>
                Approved releases from RICON talent teams — preview what subscribers receive between
                twin conversations.
              </>
            )}
          </p>
        </header>

        {invalidDropNotice && (
          <div className="feed-invalid-drop-notice" role="status">
            That drop is unavailable. It may be a draft or no longer published.
          </div>
        )}

        {!isSubscriber && (
          <section className="feed-preview-banner" aria-label="Feed preview call to action">
            <div>
              <h2 className="feed-preview-title">Preview the subscriber feed</h2>
              <p className="feed-preview-copy">
                Browse published drops below. Create a fan account to unlock your twin&apos;s full feed
                and ask about any drop in chat.
              </p>
            </div>
            <Link
              to={snapshot.user ? "/select-twin" : appendRedirectParam("/signup", "/feed")}
              className="primary-button premium-button"
            >
              {snapshot.user ? "Choose your twin" : "Sign up free"}
            </Link>
          </section>
        )}

        {isSubscriber && (
          <section className="feed-section" aria-labelledby="your-twin-drops-title">
            <div className="feed-section-heading">
              <h2 id="your-twin-drops-title" className="section-kicker">
                YOUR TWIN · {twinDrops.length} DROPS
              </h2>
            </div>

            {twinDrops.length === 0 ? (
              <div className="feed-empty">
                <p>No published drops yet for your twin. Check back soon.</p>
                {twinDraftCount > 0 && (
                  <p className="feed-empty-note">
                    {twinDraftCount} draft or approved {twinDraftCount === 1 ? "drop is" : "drops are"}{" "}
                    saved locally and hidden until published.
                  </p>
                )}
                <Link to={`/legend/${snapshot.subscription.twinId}`} className="secondary-button">
                  View twin story
                </Link>
              </div>
            ) : (
              renderGrid(twinDrops, true)
            )}
          </section>
        )}

        <section className="feed-section" aria-labelledby="feed-drops-title">
          <div className="feed-section-heading">
            <h2 id="feed-drops-title" className="section-kicker">
              {isSubscriber ? "MORE FROM STORYLINE" : "LATEST PUBLISHED DROPS"}
            </h2>
          </div>

          {(isSubscriber ? otherDrops : previewDrops).length === 0 ? (
            <div className="feed-empty">
              <p>No published drops yet. Check back soon.</p>
            </div>
          ) : (
            renderGrid(isSubscriber ? otherDrops : previewDrops)
          )}
        </section>
      </main>

      {selectedDrop && (
        <ContentDropDetailModal
          drop={selectedDrop}
          twinName={selectedTwin?.name ?? "Legend"}
          askTwinHref={resolveAskTwinHref(selectedDrop, snapshot)}
          askTwinLabel={resolveAskTwinLabel(snapshot)}
          onClose={() => setSelectedDrop(null)}
        />
      )}
    </div>
  );
}
