import { lazy, Suspense, useEffect, useState } from "react";
import Landing from "./components/Landing";
import CompanySelect from "./components/CompanySelect";
import ModeSelect from "./components/ModeSelect";
import NameEntry from "./components/NameEntry";
import Lobby from "./components/Lobby";
import Game from "./components/Game";
import Predictions from "./components/Predictions";
import TriviaQuiz from "./components/TriviaQuiz";
import { supabase } from "./lib/supabase";

const Admin = lazy(() => import("./components/Admin"));

function getInitialView() {
  const path = window.location.pathname;
  if (path === "/gate") return "admin";
  if (path === "/companies") return "companySelect";
  if (path.startsWith("/play/")) return "modeSelect";
  return "landing";
}

function getInitialCompanyId() {
  const path = window.location.pathname;
  if (path.startsWith("/play/")) return path.split("/play/")[1];
  return null;
}

function navigate(path) {
  window.history.pushState(null, "", path);
}

export default function App() {
  const [view, setView] = useState(getInitialView);
  const [session, setSession] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [company, setCompany] = useState(() => {
    const id = getInitialCompanyId();
    return id ? { id } : null;
  });

  // On a deep link (e.g. /play/hd) the company starts as a bare { id }, with no
  // emoji/name/call_identifier. Hydrate the full row so the FREE tile shows the
  // company's own emoji instead of falling back to the hotel default.
  useEffect(() => {
    if (!company?.id || company.emoji) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("id", company.id)
        .single();
      if (cancelled || !data) return;
      setCompany((prev) => (prev?.id === data.id ? { ...prev, ...data } : prev));
    })();
    return () => {
      cancelled = true;
    };
  }, [company?.id, company?.emoji]);

  useEffect(() => {
    function handlePopState() {
      const path = window.location.pathname;
      if (path === "/gate") {
        setView("admin");
      } else if (path === "/companies") {
        setView("companySelect");
      } else if (path.startsWith("/play/")) {
        setView("modeSelect");
      } else {
        setView("landing");
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handlePickCompany() {
    navigate("/companies");
    setView("companySelect");
  }

  function handleSelectCompany(comp) {
    setCompany(comp);
    navigate(`/play/${comp.id}`);
    setView("modeSelect");
  }

  function handleBingo() {
    setView("nameEntry");
  }

  function handleTrivia() {
    setView("trivia");
  }

  function handleSessionCreated(data) {
    setSession(data); // data includes { sessionId, sessionCode, playerId, displayName, card, phrases }
    setView("lobby");
  }

  function handleSessionJoined(data) {
    setSession(data); // data includes { sessionId, sessionCode, playerId, displayName, card, phrases }
    setView("lobby");
  }

  function handleStartPlaying() {
    setView("predictions");
  }

  function handlePredictionsConfirm(selected) {
    setPredictions(selected);
    setView("game");
  }

  function handlePredictionsSkip() {
    setPredictions(null);
    setView("game");
  }

  function handleExit() {
    setSession(null);
    setPredictions(null);
    setCompany(null);
    navigate("/");
    setView("landing");
  }

  function handlePlayAgain() {
    setSession(null);
    setPredictions(null);
    setView("nameEntry");
  }

  function handleBackToLanding() {
    navigate("/");
    setView("landing");
  }

  function handleBackToCompanies() {
    navigate("/companies");
    setView("companySelect");
  }

  function handleBackToMode() {
    if (company) {
      navigate(`/play/${company.id}`);
    }
    setView("modeSelect");
  }

  if (view === "admin") {
    return (
      <Suspense
        fallback={
          <div className="min-h-full bg-navy flex items-center justify-center px-6">
            <p className="text-gold text-sm font-semibold tracking-wide">
              Loading admin...
            </p>
          </div>
        }
      >
        <Admin />
      </Suspense>
    );
  }

  if (view === "landing") {
    return (
      <div className="min-h-full">
        <Landing onPickCompany={handlePickCompany} />
      </div>
    );
  }

  const content = (
    <>
      {view === "companySelect" && (
        <CompanySelect
          onSelectCompany={handleSelectCompany}
          onBack={handleBackToLanding}
        />
      )}
      {view === "modeSelect" && company && (
        <ModeSelect
          company={company}
          onBingo={handleBingo}
          onTrivia={handleTrivia}
          onBack={handleBackToCompanies}
        />
      )}
      {view === "trivia" && company && (
        <TriviaQuiz
          companyId={company.id}
          onBack={handleBackToMode}
        />
      )}
      {view === "nameEntry" && (
        <NameEntry
          companyId={company?.id}
          onSessionCreated={handleSessionCreated}
          onSessionJoined={handleSessionJoined}
          onBack={handleBackToMode}
        />
      )}
      {view === "lobby" && session && (
        <Lobby
          sessionId={session.sessionId}
          sessionCode={session.sessionCode}
          playerId={session.playerId}
          displayName={session.displayName}
          onStartPlaying={handleStartPlaying}
          onExit={handleExit}
        />
      )}
      {view === "predictions" && session && (
        <Predictions
          card={session.card}
          playerId={session.playerId}
          onConfirm={handlePredictionsConfirm}
          onSkip={handlePredictionsSkip}
        />
      )}
      {view === "game" && session && (
        <Game
          sessionId={session.sessionId}
          sessionCode={session.sessionCode}
          playerId={session.playerId}
          displayName={session.displayName}
          initialCard={session.card}
          phrases={session.phrases}
          companyId={company?.id}
          companyName={company?.name}
          companyEmoji={company?.emoji}
          callIdentifier={company?.call_identifier}
          onExit={handleExit}
          onPlayAgain={handlePlayAgain}
          predictions={predictions}
        />
      )}
    </>
  );

  return (
    <div className="min-h-full lg:bg-[#050d1a]">
      <div className="min-h-full lg:max-w-[430px] lg:mx-auto">
        {content}
      </div>
    </div>
  );
}
