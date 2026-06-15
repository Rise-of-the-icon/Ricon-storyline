import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import CSS from "./src/styles";
import HomeScreen from "./src/components/HomeScreen";
import AthleteScreen from "./src/components/AthleteScreen";
import TwinModal from "./src/components/TwinModal";
import TwinAccessGateModal from "./src/components/TwinAccessGateModal";
import SignUpScreen from "./src/components/auth/SignUpScreen";
import SignInScreen from "./src/components/auth/SignInScreen";
import SelectTwinScreen from "./src/components/auth/SelectTwinScreen";
import SubscribeScreen from "./src/components/auth/SubscribeScreen";
import SubscriptionSuccessScreen from "./src/components/auth/SubscriptionSuccessScreen";
import FeedScreen from "./src/components/feed/FeedScreen";
import FanHomeScreen from "./src/components/fan/FanHomeScreen";
import NewContentDropScreen from "./src/components/talent/NewContentDropScreen";
import { getLegacyLegendById } from "./src/data/twins";
import { canAccessTwinChat, getTwinAccessState } from "./src/lib/twinAccess";
import { buildDropChatPrompt, getContentDropById } from "./src/lib/contentDropFeed";
import { repairFanExperienceState } from "./src/lib/fanExperience";

function FanExperienceBootstrap({ children }) {
  useEffect(() => {
    repairFanExperienceState();
  }, []);

  return children;
}

function LegendRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const figmaTwinMode = searchParams.get("figmaTwin");
  const openTwinParam = searchParams.get("openTwin");
  const dropId = searchParams.get("dropId");
  const bypassGate = Boolean(figmaTwinMode);
  const athlete = id ? getLegacyLegendById(id) : undefined;
  const dropContext = dropId ? getContentDropById(dropId) : undefined;
  const initialChatPrompt =
    dropContext && dropContext.twinId === athlete?.id
      ? buildDropChatPrompt(dropContext)
      : undefined;
  const twinAccess = useMemo(
    () => (athlete ? getTwinAccessState(athlete.id) : null),
    [athlete?.id]
  );
  const initialTwinMode = figmaTwinMode === "qaThread" || openTwinParam === "qa" ? "qa" : "narrator";
  const shouldOpenInitially =
    Boolean(figmaTwinMode && bypassGate) ||
    Boolean(openTwinParam && athlete && canAccessTwinChat(athlete.id, bypassGate));
  const [twinOpen, setTwinOpen] = useState(shouldOpenInitially);
  const [gateOpen, setGateOpen] = useState(false);
  const [twinMode, setTwinMode] = useState(initialTwinMode);

  useEffect(() => {
    if (!athlete || !openTwinParam) return;
    const mode = openTwinParam === "narrator" ? "narrator" : "qa";
    setTwinMode(mode);
    if (canAccessTwinChat(athlete.id, bypassGate)) {
      setTwinOpen(true);
      setGateOpen(false);
    } else {
      setTwinOpen(false);
      setGateOpen(true);
    }
  }, [athlete?.id, openTwinParam, bypassGate]);

  useEffect(() => {
    if (!dropId || dropContext) return;
    const params = new URLSearchParams(searchParams);
    params.delete("dropId");
    const nextSearch = params.toString();
    navigate(
      { pathname: `/legend/${id}`, search: nextSearch ? `?${nextSearch}` : "" },
      { replace: true }
    );
  }, [dropId, dropContext, id, navigate, searchParams]);

  if (!athlete) {
    return <Navigate to="/" replace />;
  }

  const resetScroll = () => window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));

  const requestTwin = (mode) => {
    setTwinMode(mode);
    if (canAccessTwinChat(athlete.id, bypassGate)) {
      setGateOpen(false);
      setTwinOpen(true);
      return;
    }
    setTwinOpen(false);
    setGateOpen(true);
  };

  return (
    <>
      <AthleteScreen
        athlete={athlete}
        twinAccess={twinAccess}
        onBack={() => {
          setTwinOpen(false);
          setGateOpen(false);
          resetScroll();
          navigate("/");
        }}
        onTwin={requestTwin}
      />
      {twinOpen && (
        <TwinModal
          athlete={athlete}
          mode={twinMode}
          initialPrompt={initialChatPrompt}
          onClose={() => setTwinOpen(false)}
          onSwitchMode={(m) => setTwinMode(m)}
        />
      )}
      {gateOpen && twinAccess && !twinAccess.canAccessChat && (
        <TwinAccessGateModal
          athlete={athlete}
          access={twinAccess}
          onClose={() => setGateOpen(false)}
        />
      )}
    </>
  );
}

function HomeRoute() {
  const navigate = useNavigate();
  const resetScroll = () => window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));

  return (
    <HomeScreen
      onSelect={(legend) => {
        resetScroll();
        navigate(`/legend/${legend.id}`);
      }}
    />
  );
}

function FigmaTwinRedirect() {
  const figmaTwinMode = new URLSearchParams(window.location.search).get("figmaTwin");
  if (figmaTwinMode) {
    const search = window.location.search;
    return <Navigate to={`/legend/jordan${search}`} replace />;
  }
  return <HomeRoute />;
}

export default function RICONStoryline() {
  return (
    <>
      <style>{CSS}</style>
      <div className="ricon-root">
        <BrowserRouter>
          <FanExperienceBootstrap>
            <Routes>
            <Route path="/" element={<FigmaTwinRedirect />} />
            <Route path="/legend/:id" element={<LegendRoute />} />
            <Route path="/signup" element={<SignUpScreen />} />
            <Route path="/signin" element={<SignInScreen />} />
            <Route path="/select-twin" element={<SelectTwinScreen />} />
            <Route path="/subscribe" element={<SubscribeScreen />} />
            <Route path="/subscription-success" element={<SubscriptionSuccessScreen />} />
            <Route path="/fan/home" element={<FanHomeScreen />} />
            <Route path="/home" element={<Navigate to="/fan/home" replace />} />
            <Route path="/feed" element={<FeedScreen />} />
            <Route path="/talent/drops/new" element={<NewContentDropScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </FanExperienceBootstrap>
        </BrowserRouter>
      </div>
    </>
  );
}
