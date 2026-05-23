import { useState, useEffect } from "react";
import { createSession, joinSession } from "../lib/session";

export default function NameEntry({ onSessionCreated, onSessionJoined, onBack }) {
  const [name, setName] = useState(
    () => localStorage.getItem("thereitis_display_name") || "",
  );
  const [mode, setMode] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    if (name.trim()) localStorage.setItem("thereitis_display_name", name.trim());
  }, [name]);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading("create");
    setError("");
    try {
      const result = await createSession(name.trim());
      onSessionCreated({
        sessionId: result.session.id,
        sessionCode: result.session.session_code,
        playerId: result.player.id,
        displayName: name.trim(),
        card: result.card,
      });
    } catch {
      setError("Failed to create session. Try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleJoin() {
    if (!name.trim() || joinCode.length < 6) return;
    setLoading("join");
    setError("");
    try {
      const result = await joinSession(joinCode.trim(), name.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      onSessionJoined({
        sessionId: result.session.id,
        sessionCode: result.session.session_code,
        playerId: result.player.id,
        displayName: name.trim(),
        card: result.card,
        sessionStatus: result.session.status,
      });
    } catch {
      setError("Failed to join session. Try again.");
    } finally {
      setLoading(null);
    }
  }

  const canCreate = name.trim().length >= 1;
  const canJoin = name.trim().length >= 1 && joinCode.trim().length === 6;

  return (
    <div className="bg-radial-navy min-h-full flex flex-col">
      <header className="pt-10 pb-6 px-6 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-cream">
          There It Is<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.32em] text-cream/60">
          Earnings Call Bingo
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-cream/50 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoComplete="off"
              className="w-full rounded-xl bg-navy-2/80 border border-cream/10 text-cream px-4 py-3 text-lg placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!canCreate || loading}
            className="w-full rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99] transition disabled:opacity-40"
          >
            {loading === "create" ? "Creating…" : "Create Session"}
          </button>

          {mode !== "join" ? (
            <button
              onClick={() => setMode("join")}
              disabled={!canCreate}
              className="w-full rounded-2xl border border-cream/20 text-cream py-3 font-semibold active:scale-[0.99] transition disabled:opacity-40"
            >
              Join Session
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(e.target.value.toUpperCase().slice(0, 6))
                }
                placeholder="Enter 6-digit code"
                maxLength={6}
                autoComplete="off"
                className="w-full rounded-xl bg-navy-2/80 border border-cream/10 text-cream px-4 py-3 text-lg text-center tracking-[0.5em] placeholder:text-cream/30 placeholder:tracking-normal focus:outline-none focus:border-gold/60 font-mono transition"
              />
              <button
                onClick={handleJoin}
                disabled={!canJoin || loading}
                className="w-full rounded-2xl border border-gold/60 text-cream py-3 font-semibold active:scale-[0.99] transition disabled:opacity-40"
              >
                {loading === "join" ? "Joining…" : "Join Session"}
              </button>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            onClick={onBack}
            className="w-full text-cream/40 text-xs uppercase tracking-[0.3em] py-2 active:text-cream transition"
          >
            ← Back
          </button>
        </div>
      </main>
    </div>
  );
}
