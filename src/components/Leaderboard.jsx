const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ players, currentPlayerId, onClose }) {
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <button
      onClick={onClose}
      className="fixed inset-0 z-50 bg-navy/90 backdrop-blur-sm flex items-center justify-center px-6"
      aria-label="Dismiss leaderboard"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-navy-2/95 border border-gold/40 p-5 shadow-2xl"
      >
        <div className="text-center mb-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-cream/50">
            Leaderboard
          </div>
        </div>

        <div className="space-y-2">
          {sorted.map((player, i) => {
            const isMe = player.id === currentPlayerId;
            const medal = i < 3 ? MEDALS[i] : null;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                  isMe ? "bg-gold/10 border border-gold/30" : "bg-cream/5"
                }`}
              >
                <span className="w-6 text-center text-sm">
                  {medal || <span className="text-cream/40">{i + 1}</span>}
                </span>
                <span
                  className={`flex-1 text-sm ${isMe ? "text-gold font-semibold" : "text-cream"}`}
                >
                  {player.display_name}
                  {isMe && (
                    <span className="text-cream/40 text-xs ml-1">(you)</span>
                  )}
                </span>
                <span className="text-sm text-cream/70 tabular-nums font-semibold">
                  {(player.score || 0).toLocaleString()}
                </span>
                <span className="text-xs text-cream/40 tabular-nums w-8 text-right">
                  {(player.bingo_count || 0) > 0
                    ? `${player.bingo_count}B`
                    : ""}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center text-cream/30 text-[10px] uppercase tracking-[0.3em]">
          tap outside to close
        </div>
      </div>
    </button>
  );
}
