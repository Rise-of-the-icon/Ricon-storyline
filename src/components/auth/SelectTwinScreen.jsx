import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FlowSteps from "./FlowSteps";
import TwinSelectCard from "./TwinSelectCard";
import SelectTwinSummary from "./SelectTwinSummary";
import { getSubscribableTwins, getTwinById } from "../../data/twins";
import {
  getValidSelectedTwinId,
  appendRedirectParam,
  resolveSelectTwinGuardRedirect,
} from "../../lib/fanExperience";
import {
  getStoredUser,
  initUserSession,
  setSelectedTwinId,
} from "../../lib/storage";
import FanRouteRedirect from "../routing/FanRouteRedirect";

export default function SelectTwinScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const guardRedirect = resolveSelectTwinGuardRedirect(redirectTarget);
  const user = getStoredUser();
  const twins = getSubscribableTwins();
  const [selectedId, setSelectedId] = useState(() => getValidSelectedTwinId());
  const [continuing, setContinuing] = useState(false);

  if (guardRedirect) {
    const destination =
      guardRedirect.startsWith("/signup")
        ? appendRedirectParam("/signup", redirectTarget ?? "/select-twin")
        : guardRedirect;
    return <FanRouteRedirect to={destination} />;
  }

  const selectedTwin = selectedId ? getTwinById(selectedId) : undefined;

  const handleSelect = (twinId) => {
    setSelectedId(twinId);
    setSelectedTwinId(twinId);
    initUserSession(user.id, twinId);
  };

  const handleContinue = () => {
    if (!selectedId) return;
    setContinuing(true);
    setSelectedTwinId(selectedId);
    initUserSession(user.id, selectedId);
    window.setTimeout(() => {
      navigate(appendRedirectParam("/subscribe", redirectTarget), { replace: true });
    }, 280);
  };

  return (
    <div className="animate-page-enter auth-page select-twin-page">
      <nav className="app-nav sticky" aria-label="Select twin">
        <span className="brand-mark">RICON</span>
        <div className="nav-divider" />
        <span className="brand-submark">Storyline</span>
        <div className="nav-spacer" />
        <div className="status-pill">Fan Experience · Step 2 of 3</div>
      </nav>

      <main className="select-twin-main">
        <header className="select-twin-header">
          <FlowSteps currentStep={2} />
          <p className="auth-kicker">Storyline Access</p>
          <h1 className="auth-title">Choose your home twin</h1>
          <p className="auth-lead">
            Pick the legend you want featured on your feed and home screen. After checkout, you can
            chat with every verified digital twin.
          </p>
        </header>

        <div className="select-twin-body">
          <section className="select-twin-grid-wrap" aria-label="Available twins">
            <div className="select-twin-grid">
              {twins.map((twin) => (
                <TwinSelectCard
                  key={twin.id}
                  twin={twin}
                  selected={selectedId === twin.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </section>

          <SelectTwinSummary
            twin={selectedTwin}
            onContinue={handleContinue}
            continuing={continuing}
          />
        </div>
      </main>
    </div>
  );
}
