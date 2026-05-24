import { TIER } from "../lib/phrases";

function sizeClass(phrase) {
  const len = phrase.length;
  const longestWord = Math.max(...phrase.split(/[\s\-]/).map((w) => w.length));

  if (longestWord > 10) {
    if (len <= 14) return "text-[10px] leading-snug";
    return "text-[9px] leading-snug";
  }

  if (len <= 8) return "text-[13px] leading-tight";
  if (len <= 12) return "text-[12px] leading-tight";
  if (len <= 16) return "text-[11px] leading-tight";
  if (len <= 20) return "text-[10px] leading-snug";
  return "text-[9px] leading-snug";
}

export default function Tile({ cell, onTap, onLine, isPrediction, predictionHit, isGreatQuestion }) {
  const { phrase, tier, isFree, marked } = cell;
  const dot = TIER[tier]?.dot || "";

  const base =
    "relative aspect-square rounded-lg flex items-center justify-center text-center px-1 py-1 select-none touch-manipulation transition-all duration-200 break-words";

  const stateClasses = marked
    ? "bg-gold text-navy font-semibold shadow-gold"
    : isFree
      ? "bg-cream text-navy font-bold"
      : isPrediction
        ? "bg-purple-200 text-navy/90 hover:bg-purple-100 active:scale-95 ring-2 ring-purple-400"
        : "bg-cream text-navy/90 hover:bg-cream/90 active:scale-95";

  const lineGlow = onLine ? "ring-2 ring-gold-bright shadow-gold-strong animate-glow" : "";
  const burstAnim = isGreatQuestion ? "animate-goldBurst" : "";

  return (
    <button
      onClick={onTap}
      disabled={isFree}
      className={`${base} ${stateClasses} ${lineGlow} ${burstAnim}`}
      aria-label={isFree ? "Free space" : `${phrase}, ${tier}`}
      aria-pressed={!!marked}
    >
      {!isFree && (
        <span className="absolute top-0.5 left-1 text-[9px] opacity-70" aria-hidden>
          {dot}
        </span>
      )}
      {predictionHit && (
        <span className="absolute top-0.5 right-1 text-[9px]" aria-hidden>
          🔮
        </span>
      )}
      {isFree ? (
        <span className="flex flex-col items-center justify-center leading-tight">
          <span className="text-2xl" aria-hidden>🏨</span>
          <span className="text-[11px] font-bold tracking-wider mt-0.5">FREE</span>
        </span>
      ) : (
        <span className={`${sizeClass(phrase)} font-medium px-0.5`}>{phrase}</span>
      )}
      {marked && !isFree && (
        <span
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <span className="text-2xl text-navy/30 animate-check">✓</span>
        </span>
      )}
    </button>
  );
}
