import { useState } from "react";
import Landing from "./components/Landing";
import NameEntry from "./components/NameEntry";
import Lobby from "./components/Lobby";
import Game from "./components/Game";

export default function App() {
  const [view, setView] = useState("landing");
  const [session, setSession] = useState(null);

  function handleSessionCreated(data) {
    setSession({ ...data, isCreator: true });
    setView("lobby");
  }

  function handleSessionJoined(data) {
    setSession({ ...data, isCreator: false });
    setView(data.sessionStatus === "active" ? "game" : "lobby");
  }

  function handleExit() {
    setSession(null);
    setView("landing");
  }

  function handlePlayAgain() {
    setSession(null);
    setView("nameEntry");
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
          isCreator={session.isCreator}
          onGameStart={() => setView("game")}
          onExit={handleExit}
        />
      )}
      {view === "game" && session && (
        <Game
          sessionId={session.sessionId}
          playerId={session.playerId}
          displayName={session.displayName}
          isCreator={session.isCreator}
          initialCard={session.card}
          onExit={handleExit}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
