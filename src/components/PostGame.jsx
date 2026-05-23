import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { TIER } from "../lib/phrases";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function PostGame({
  grid,
  score,
  didBingo,
  didBlackout,
  onPlayAgain,
  players,
  currentPlayerId,
}) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);

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
    players && players.length > 1
      ? [...players].sort((a, b) => (b.score || 0) - (a.score || 0))
      : [];

  async function share() {
    if (!cardRef.current) return;
    try {
      setBusy(true);
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0A1628",
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "there-it-is.png", {
          type: "image/png",
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "There It Is",
              text: `I scored ${score.toLocaleString()} on the earnings call.`,
            });
          } catch {
            // user cancelled
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "there-it-is.png";
          a.click();
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-radial-navy min-h-full flex flex-col">
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
              Hilton · Q2 2026
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
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-navy-2/95 backdrop-blur border-t border-cream/10 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={share}
            disabled={busy}
            className="flex-1 rounded-2xl border border-gold/60 text-cream py-3 font-semibold active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? "Generating…" : "Share Card"}
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99]"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
