export default function Celebration({ kind, onClose }) {
  if (!kind) return null;
  const isBlackout = kind === "blackout";
  const title = isBlackout ? "ABSOLUTELY THERE IT IS." : "THERE IT IS.";
  const sub = isBlackout ? "Blackout · +2,000" : "Bingo · +500";

  return (
    <button
      onClick={onClose}
      className="fixed inset-0 z-50 bg-navy/95 backdrop-blur-sm flex flex-col items-center justify-center px-6 text-center"
      aria-label="Dismiss celebration"
    >
      <div className="animate-celebrate">
        <div
          className={`font-display font-black text-gold drop-shadow-[0_0_24px_rgba(212,175,55,0.6)] ${
            isBlackout ? "text-5xl sm:text-6xl" : "text-5xl sm:text-7xl"
          }`}
        >
          {title}
        </div>
        <div className="mt-4 text-cream/80 uppercase tracking-[0.4em] text-xs">
          {sub}
        </div>
        <div className="mt-10 text-cream/40 text-xs uppercase tracking-[0.3em]">
          tap to keep playing
        </div>
      </div>
    </button>
  );
}
