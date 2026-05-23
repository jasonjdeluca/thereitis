import { useState } from "react";
import Landing from "./components/Landing";
import Game from "./components/Game";

export default function App() {
  const [view, setView] = useState("landing");

  return (
    <div className="min-h-full">
      {view === "landing" ? (
        <Landing onStart={() => setView("game")} />
      ) : (
        <Game onExit={() => setView("landing")} />
      )}
    </div>
  );
}
