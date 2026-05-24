import { useState, useEffect } from "react";
import Landing from "./components/Landing";
import CompanySelect from "./components/CompanySelect";
import ModeSelect from "./components/ModeSelect";
import NameEntry from "./components/NameEntry";
import Lobby from "./components/Lobby";
import Game from "./components/Game";
import Admin from "./components/Admin";
import Predictions from "./components/Predictions";
import TriviaQuiz from "./components/TriviaQuiz";

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
    setSession(data);
    setView("lobby");
  }

  function handleSessionJoined(data) {
    setSession(data);
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
    return <Admin />;
  }

  return (
    <div className="min-h-full">
      {view === "landing" && (
        <Landing onPickCompany={handlePickCompany} />
      )}
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
          companyName={company?.name}
          callIdentifier={company?.call_identifier}
          onExit={handleExit}
          onPlayAgain={handlePlayAgain}
          predictions={predictions}
        />
      )}
    </div>
  );
}
