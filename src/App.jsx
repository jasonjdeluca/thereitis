import { useState } from "react";
import Landing from "./components/Landing";
import NameEntry from "./components/NameEntry";
import Lobby from "./components/Lobby";
import Game from "./components/Game";
import Admin from "./components/Admin";
import Predictions from "./components/Predictions";

function getInitialView() {
  if (window.location.pathname === "/gate") return "admin";
  return "landing";
}

export default function App() {
  const [view, setView] = useState(getInitialView);
  const [session, setSession] = useState(null);
  const [predictions, setPredictions] = useState(null);

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
    setView("landing");
  }

  function handlePlayAgain() {
    setSession(null);
    setPredictions(null);
    setView("nameEntry");
  }

  if (view === "admin") {
    return <Admin />;
  }

  return (
    <div className="min-h-full">
      {view === "landing" && (
        <Landing onStart={() => setView("nameEntry")} />
      )}
      {view === "nameEntry" && (
        <NameEntry
          onSessionCreated={handleSessionCreated}
          onSessionJoined={handleSessionJoined}
          onBack={() => setView("landing")}
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
          onExit={handleExit}
          onPlayAgain={handlePlayAgain}
          predictions={predictions}
        />
      )}
    </div>
  );
}
