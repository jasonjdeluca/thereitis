function ToolbarTooltip({ label, children }) {
  return (
    <div className="group relative">
      {children}
      <div className="hidden lg:block pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div
          className="whitespace-nowrap rounded-md px-2 py-1 text-white border"
          style={{
            backgroundColor: "#0A1628",
            borderColor: "rgba(255,255,255,0.15)",
            fontSize: "11px",
            lineHeight: "1.4",
          }}
        >
          {label}
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
          style={{
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderTop: "4px solid rgba(255,255,255,0.15)",
          }}
        />
      </div>
    </div>
  );
}

export default function Toolbar({ score, streak, onShare, onEnd, onLeaderboard }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-navy-2/90 backdrop-blur border-t border-cream/10 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <ToolbarTooltip label="Your score">
          <div className="flex items-center gap-1.5 text-cream">
            <span aria-hidden>⭐</span>
            <span className="font-display font-bold text-lg tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>
        </ToolbarTooltip>
        <ToolbarTooltip label="Current streak">
          <div className="flex items-center gap-1.5 text-cream/90 text-sm tabular-nums">
            <span aria-hidden>🔥</span>
            <span className="font-semibold">{streak}</span>
          </div>
        </ToolbarTooltip>
        <div className="flex items-center gap-2">
          <ToolbarTooltip label="Leaderboard">
            <button
              onClick={onLeaderboard}
              className="text-cream/80 hover:text-gold active:scale-95 px-2 py-1 text-lg"
              aria-label="Leaderboard"
            >
              <span aria-hidden>🏆</span>
            </button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Share results">
            <button
              onClick={onShare}
              className="text-cream/80 hover:text-gold active:scale-95 px-2 py-1 text-lg"
              aria-label="Share"
            >
              <span aria-hidden>📤</span>
            </button>
          </ToolbarTooltip>
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
