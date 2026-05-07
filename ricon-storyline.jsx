import { useState } from "react";
import CSS from "./src/styles";
import HomeScreen from "./src/components/HomeScreen";
import AthleteScreen from "./src/components/AthleteScreen";
import TwinModal from "./src/components/TwinModal";
import { ATHLETES } from "./src/data/athletes";

export default function RICONStoryline() {
  const figmaTwinMode = new URLSearchParams(window.location.search).get("figmaTwin");
  const figmaAthlete = figmaTwinMode ? ATHLETES.find(a => a.id === "jordan") : null;
  const [screen, setScreen] = useState(figmaAthlete ? "athlete" : "home");
  const [athlete, setAthlete] = useState(figmaAthlete);
  const [twinOpen, setTwinOpen] = useState(Boolean(figmaTwinMode));
  const [twinMode, setTwinMode] = useState(figmaTwinMode || "narrator");

  const resetScroll = () => window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  const openAthlete = (a) => { setAthlete(a); setScreen("athlete"); resetScroll(); };
  const goHome = () => { setScreen("home"); setAthlete(null); setTwinOpen(false); resetScroll(); };
  const openTwin = (mode) => { setTwinMode(mode); setTwinOpen(true); };

  return (
    <>
      <style>{CSS}</style>
      <div className="ricon-root">
        {screen === "home" && <HomeScreen onSelect={openAthlete} />}
        {screen === "athlete" && athlete && (
          <AthleteScreen athlete={athlete} onBack={goHome} onTwin={openTwin} />
        )}
        {twinOpen && athlete && (
          <TwinModal
            athlete={athlete}
            mode={twinMode}
            onClose={() => setTwinOpen(false)}
            onSwitchMode={(m) => setTwinMode(m)}
          />
        )}
      </div>
    </>
  );
}
