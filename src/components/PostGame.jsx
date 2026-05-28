import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { TIER } from "../lib/phrases";
import { evaluateBadges } from "../lib/badges";
import { supabase } from "../lib/supabase";
import BadgeReveal from "./BadgeReveal";

const MEDALS = ["🥇", "🥈", "🥉"];

function isMobile() {
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 768)
  );
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "thereitis-result.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function PostGame({
  grid,
  score,
  didBingo,
  didBlackout,
  onPlayAgain,
  players,
  currentPlayerId,
  maxStreak,
  predictions,
  trinityFired,
  inSyncFired,
  ceoMode,
  sessionId,
  companyId,
  companyName,
  callIdentifier,
}) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [mostHeard, setMostHeard] = useState(null);
  const isMultiplayer = players && players.length > 1;

  const earnedBadges = useMemo(
    () =>
      evaluateBadges({
        grid,
        didBingo,
        didBlackout,
        maxStreak: maxStreak || 0,
        predictions: predictions || [],
        trinityFired: trinityFired || false,
        inSyncFired: inSyncFired || false,
      }),
    [grid, didBingo, didBlackout, maxStreak, predictions, trinityFired, inSyncFired],
  );

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(id);
  }, [error]);

  useEffect(() => {
    async function fetchMostHeard() {
      if (!companyId || !callIdentifier) return;

      const { data: sessions } = await supabase
        .from("sessions")
        .select("id")
        .eq("company_id", companyId);

      if (!sessions || sessions.length === 0) return;

      const sessionIds = sessions.map((s) => s.id);

      const { data: marks } = await supabase
        .from("marks")
        .select("phrase")
        .in("session_id", sessionIds);

      if (!marks || marks.length === 0) return;

      const counts = {};
      marks.forEach((m) => {
        counts[m.phrase] = (counts[m.phrase] || 0) + 1;
      });

      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        setMostHeard({ phrase: sorted[0][0], count: sorted[0][1] });
      }
    }
    fetchMostHeard();
  }, [companyId, callIdentifier]);

  const markedPhrases = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = grid[r][c];
      if (cell.marked && !cell.isFree) markedPhrases.push(cell);
    }
  }

  const headline = didBlackout
    ? "ABSOLUTELY THERE IT IS."
    : didBingo
      ? "THERE IT IS."
      : "Game Over";

  const sorted =
    isMultiplayer
      ? [...players].sort((a, b) => (b.score || 0) - (a.score || 0))
      : [];

  async function share() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0A1628",
        scale: 2,
        useCORS: true,
      });

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );

      if (!blob) {
        setError("Could not save card — try a screenshot instead.");
        return;
      }

      if (isMobile() && navigator.canShare) {
        const file = new File([blob], "thereitis-result.png", {
          type: "image/png",
        });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "There It Is",
              text: `I scored ${score.toLocaleString()} on the earnings call.`,
            });
            return;
          } catch (e) {
            if (e.name === "AbortError") return;
          }
        }
      }

      downloadBlob(blob);
    } catch {
      setError("Could not save card — try a screenshot instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-radial-navy min-h-full flex flex-col">
      {error && (
        <div className="fixed top-3 inset-x-0 z-40 flex justify-center px-3 pointer-events-none">
          <div className="animate-toastIn rounded-full bg-navy-2/95 border border-gold/60 shadow-gold px-4 py-2 text-sm text-cream max-w-xs text-center">
            {error}
          </div>
        </div>
      )}

      <div className="flex-1 px-5 pt-8 pb-32 max-w-md mx-auto w-full">
        <div
          ref={cardRef}
          className="rounded-3xl bg-navy-2/80 border border-gold/40 p-6 shadow-2xl"
        >
          <div className="text-center">
            <div className="text-3xl mb-1" aria-hidden>
              🏨
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-cream/60">
              {companyName || "There It Is"}{callIdentifier ? ` · ${callIdentifier}` : ""}{ceoMode ? " · CEO Mode" : ""}
            </div>
            <h2 className="mt-3 font-display font-black text-2xl text-gold leading-tight">
              {headline}
            </h2>
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-cream/50">
                Final Score
              </div>
              <div className="font-display font-black text-5xl text-cream tabular-nums">
                {score.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-cream/50 mb-2">
              {markedPhrases.length} hits
            </div>
            <div className="flex flex-wrap gap-1.5">
              {markedPhrases.length === 0 && (
                <div className="text-cream/50 text-sm italic">
                  No phrases marked.
                </div>
              )}
              {markedPhrases.map((cell, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-gold/15 border border-gold/40 px-2.5 py-1 text-[11px] text-cream"
                >
                  <span className="opacity-70" aria-hidden>
                    {TIER[cell.tier].dot}
                  </span>
                  <span>{cell.phrase}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] uppercase tracking-[0.32em] text-cream/40">
            There It Is<span className="text-gold">.</span>
          </div>
        </div>

        <BadgeReveal badgeIds={earnedBadges} />

        {mostHeard && (
          <div className="mt-6 rounded-2xl bg-navy-2/80 border border-gold/20 p-5 text-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">
              Most Heard This Call
            </div>
            <div className="font-display text-lg font-bold text-cream">
              {mostHeard.phrase}
            </div>
            <div className="mt-1 text-xs text-cream/40">
              Marked by {mostHeard.count} player{mostHeard.count !== 1 ? "s" : ""} across all sessions today
            </div>
          </div>
        )}

        {sorted.length > 0 && (
          <div className="mt-6 rounded-2xl bg-navy-2/80 border border-cream/10 p-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-cream/50 mb-3 text-center">
              Session Leaderboard
            </div>
            <div className="space-y-2">
              {sorted.map((player, i) => {
                const isMe = player.id === currentPlayerId;
                const medal = i < 3 ? MEDALS[i] : null;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                      isMe
                        ? "bg-gold/10 border border-gold/30"
                        : "bg-cream/5"
                    }`}
                  >
                    <span className="w-6 text-center text-sm">
                      {medal || (
                        <span className="text-cream/40">{i + 1}</span>
                      )}
                    </span>
                    <span
                      className={`flex-1 text-sm ${isMe ? "text-gold font-semibold" : "text-cream"}`}
                    >
                      {player.display_name}
                      {isMe && (
                        <span className="text-cream/40 text-xs ml-1">
                          (you)
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-cream/70 tabular-nums font-semibold">
                      {(player.score || 0).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isMultiplayer && (
          <div className="mt-6 text-center">
            <p className="text-sm italic text-cream/40">
              See you next quarter! Bring someone next time — the more people on
              the call, the better this gets.
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-navy-2/95 backdrop-blur border-t border-cream/10 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={share}
              disabled={busy}
              className="flex-1 rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99] disabled:opacity-50"
            >
              {busy ? "Generating…" : "Share Card"}
            </button>
            <button
              onClick={onPlayAgain}
              className="flex-1 rounded-2xl border border-gold/60 bg-transparent text-gold py-3 font-semibold active:scale-[0.99]"
            >
              Play Again
            </button>
          </div>
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}
            className="block w-full text-center mt-3"
            style={{ fontSize: '12px', color: '#667788' }}
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
