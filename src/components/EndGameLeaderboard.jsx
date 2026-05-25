import { useState } from "react";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function EndGameLeaderboard({
  players,
  currentPlayerId,
  onContinue,
}) {
  const [copied, setCopied] = useState(false);

  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  async function handleShare() {
    const text =
      "I just played There It Is — earnings call bingo, live during the call. Join me next quarter: thereitis.live";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="bg-radial-navy min-h-full flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h2 className="font-display text-2xl font-black text-cream">
            That's a wrap. 👋
          </h2>
          <p className="mt-2 text-sm text-cream/60">
            Here's how it ended.
          </p>
        </div>

        <div className="rounded-2xl bg-navy-2/80 border border-cream/10 p-5">
          <div className="space-y-2">
            {sorted.map((player, i) => {
              const isMe = player.id === currentPlayerId;
              const medal = i < 3 ? MEDALS[i] : null;
              const isActive = player.status !== "ended";
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
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
                    className={`flex-1 text-sm flex items-center gap-1.5 ${isMe ? "text-gold font-semibold" : "text-cream"}`}
                  >
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    )}
                    {player.display_name}
                    {isMe && (
                      <span className="text-cream/40 text-xs">(you)</span>
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

        <div className="text-center">
          <p className="text-sm italic text-cream/40">
            See you next quarter! Bring someone next time — the more people on
            the call, the better this gets.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full rounded-2xl border border-gold/60 text-cream py-3 font-semibold active:scale-[0.99] transition"
          >
            {copied ? "Copied! ✓" : "Share with a Colleague →"}
          </button>
          <button
            onClick={onContinue}
            className="w-full rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99] transition"
          >
            Continue &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
