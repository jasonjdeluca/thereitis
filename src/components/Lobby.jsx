import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export default function Lobby({
  sessionId,
  sessionCode,
  playerId,
  displayName,
  onStartPlaying,
  onExit,
}) {
  const [players, setPlayers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    async function checkExpiry() {
      const { data } = await supabase
        .from("sessions")
        .select("created_at, status")
        .eq("id", sessionId)
        .single();

      if (data) {
        const age = Date.now() - new Date(data.created_at).getTime();
        if (age > SIX_HOURS_MS || data.status === "ended") {
          setExpired(true);
        }
      }
    }
    checkExpiry();
  }, [sessionId]);

  useEffect(() => {
    const channel = supabase.channel(`lobby:${sessionId}`);

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const list = Object.values(state)
        .flat()
        .map((p) => ({
          player_id: p.player_id,
          display_name: p.display_name,
        }));
      setPlayers(list);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          display_name: displayName,
          player_id: playerId,
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, playerId, displayName]);

  async function handleCopy() {
    const text = `Join my There It Is session! Go to thereitis.live and enter code: ${sessionCode}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  if (expired) {
    return (
      <div className="bg-radial-navy min-h-full flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="text-3xl">⏰</div>
          <h2 className="font-display text-xl font-bold text-cream">
            Session Expired
          </h2>
          <p className="text-cream/60 text-sm">
            This session has been inactive for over 6 hours.
          </p>
          <button
            onClick={onExit}
            className="mt-4 rounded-2xl bg-gold text-navy px-6 py-3 font-semibold active:scale-[0.99] transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-radial-navy min-h-full flex flex-col">
      <header className="pt-8 pb-4 px-6">
        <button
          onClick={onExit}
          className="text-cream/50 text-xs uppercase tracking-[0.3em] active:text-cream transition"
        >
          ← Exit
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-cream/50 mb-2">
              Session Code
            </div>
            <button
              onClick={handleCopy}
              className="font-mono text-4xl sm:text-5xl font-bold text-gold tracking-[0.4em] active:scale-95 transition"
            >
              {sessionCode}
            </button>
            <div className="mt-2 text-xs text-cream/40">
              {copied ? "Copied!" : "Tap to copy invite"}
            </div>
          </div>

          <div className="rounded-2xl bg-navy-2/80 border border-cream/10 p-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-cream/50 mb-3">
              Players ({players.length})
            </div>
            <div className="space-y-2">
              {players.map((p, i) => (
                <div
                  key={p.player_id || i}
                  className="flex items-center gap-2 text-cream"
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm">{p.display_name}</span>
                  {p.player_id === playerId && (
                    <span className="text-[10px] text-cream/40">(you)</span>
                  )}
                </div>
              ))}
              {players.length === 0 && (
                <div className="text-cream/40 text-sm">
                  Waiting for players…
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onStartPlaying}
            className="w-full rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99] transition"
          >
            I'm Ready — Start Playing
          </button>

          <p className="text-cream/40 text-[11px]">
            Share the code above — friends can join anytime, even after you start
          </p>
        </div>
      </main>
    </div>
  );
}
