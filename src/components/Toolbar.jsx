export default function Toolbar({ score, streak, onShare, onEnd, onLeaderboard }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-navy-2/90 backdrop-blur border-t border-cream/10 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-cream">
          <span aria-hidden>⭐</span>
          <span className="font-display font-bold text-lg tabular-nums">
            {score.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-cream/90 text-sm tabular-nums">
          <span aria-hidden>🔥</span>
          <span className="font-semibold">{streak}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLeaderboard}
            className="text-cream/80 hover:text-gold active:scale-95 px-2 py-1 text-lg"
            aria-label="Leaderboard"
          >
            <span aria-hidden>🏆</span>
          </button>
          <button
            onClick={onShare}
            className="text-cream/80 hover:text-gold active:scale-95 px-2 py-1 text-lg"
            aria-label="Share"
          >
            <span aria-hidden>📤</span>
          </button>
          <button
            onClick={onEnd}
            className="text-cream/80 hover:text-gold active:scale-95 text-xs uppercase tracking-widest border border-cream/20 rounded-full px-3 py-1"
          >
            End
          </button>
        </div>
      </div>
    </div>
  );
}
