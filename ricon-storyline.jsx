import { useEffect, useRef, useState } from "react";
import CSS from "./src/styles";
import HomeScreen from "./src/components/HomeScreen";
import TwinModal, { prewarmOpeningNarrative } from "./src/components/TwinModal";
import { LEGENDS } from "./src/data/athletes";

export default function RICONStoryline() {
  const figmaTwinMode = new URLSearchParams(window.location.search).get("figmaTwin");
  const figmaAthlete = figmaTwinMode ? LEGENDS.find(a => a.id === "jordan") : null;
  const [screen, setScreen] = useState(figmaAthlete ? "athlete" : "home");
  const [athlete, setAthlete] = useState(figmaAthlete);
  const [twinMode, setTwinMode] = useState(
    figmaTwinMode === "qaThread" ? "qa" : (figmaTwinMode || "narrator")
  );
  const [prewarmedNarrative, setPrewarmedNarrative] = useState(null);
  const [transitionPhase, setTransitionPhase] = useState("entered");
  const [leavingPage, setLeavingPage] = useState(null);
  const [leavingActive, setLeavingActive] = useState(false);
  const prewarmCache = useRef(new Map());
  const transitionFrame = useRef(null);

  const resetScroll = () => window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  const startScreenTransition = (nextScreen, nextAthlete = null) => {
    if (transitionFrame.current) window.cancelAnimationFrame(transitionFrame.current);
    setLeavingPage({ screen, athlete });
    setLeavingActive(false);
    setTransitionPhase("entering");
    setScreen(nextScreen);
    setAthlete(nextAthlete);
    resetScroll();
    transitionFrame.current = window.requestAnimationFrame(() => {
      setLeavingActive(true);
      setTransitionPhase("entered");
      transitionFrame.current = null;
    });
  };
  const openAthlete = (a) => {
    setPrewarmedNarrative(prewarmCache.current.get(a.id) || null);
    setTwinMode("narrator");
    startScreenTransition("athlete", a);
  };
  const goHome = () => {
    setPrewarmedNarrative(null);
    setTwinMode("narrator");
    startScreenTransition("home");
  };

  useEffect(() => {
    if (screen !== "athlete" || !athlete) return undefined;

    if (prewarmCache.current.has(athlete.id)) {
      setPrewarmedNarrative(prewarmCache.current.get(athlete.id));
      return undefined;
    }

    let cancelled = false;
    prewarmOpeningNarrative(athlete)
      .then((response) => {
        prewarmCache.current.set(athlete.id, response);
        if (!cancelled) setPrewarmedNarrative(response);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [screen, athlete]);

  useEffect(() => () => {
    if (transitionFrame.current) window.cancelAnimationFrame(transitionFrame.current);
  }, []);

  const renderPage = (pageScreen, pageAthlete, isLeaving = false) => {
    if (pageScreen === "home") {
      return <HomeScreen onSelect={isLeaving ? () => {} : openAthlete} />;
    }

    if (pageScreen === "athlete" && pageAthlete) {
      // Avoid mounting a second twin engine during page-exit transitions.
      if (isLeaving) {
        return <div className="twin-details-page twin-details-leaving" aria-hidden="true" />;
      }

      return (
        <TwinModal
          key={pageAthlete.id}
          presentation="page"
          athlete={pageAthlete}
          mode={twinMode}
          prewarmedNarrative={twinMode === "narrator" ? prewarmedNarrative : null}
          onClose={goHome}
          onSwitchMode={(m) => setTwinMode(m)}
        />
      );
    }

    return null;
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ricon-root">
        <div className="page-transition-stage">
          {leavingPage && (
            <div
              className={`page-transition-layer page-transition-exit${leavingActive ? " is-leaving" : ""}`}
              aria-hidden="true"
              onTransitionEnd={(event) => {
                if (event.target !== event.currentTarget) return;
                setLeavingPage(null);
                setLeavingActive(false);
              }}
            >
              {renderPage(leavingPage.screen, leavingPage.athlete, true)}
            </div>
          )}
          <div className={`page-transition-layer page-transition-${transitionPhase}`} key={`${screen}-${athlete?.id || "home"}`}>
            {renderPage(screen, athlete)}
          </div>
        </div>
      </div>
    </>
  );
}
