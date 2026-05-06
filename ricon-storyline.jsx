import { useState } from "react";
import CSS from "./src/styles";
import HomeScreen from "./src/components/HomeScreen";
import AthleteScreen from "./src/components/AthleteScreen";
import TwinModal from "./src/components/TwinModal";

export default function RICONStoryline() {
  const [screen, setScreen] = useState("home");
  const [athlete, setAthlete] = useState(null);
  const [twinOpen, setTwinOpen] = useState(false);
  const [twinMode, setTwinMode] = useState("narrator");

  const openAthlete = (a) => { setAthlete(a); setScreen("athlete"); };
  const goHome = () => { setScreen("home"); setAthlete(null); setTwinOpen(false); };
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
