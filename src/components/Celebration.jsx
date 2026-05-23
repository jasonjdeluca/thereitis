import { useMemo } from "react";

export default function Celebration({ kind, onClose }) {
  if (!kind) return null;
  const isBlackout = kind === "blackout";
  const title = isBlackout ? "ABSOLUTELY THERE IT IS." : "THERE IT IS.";
  const sub = isBlackout ? "Blackout · +2,000" : "Bingo · +500";

  const burstDelays = isBlackout ? [0, 100, 200, 300, 400] : [0, 150, 300];
  const emojiSize = isBlackout
    ? "text-5xl sm:text-6xl"
    : "text-4xl sm:text-5xl";
  const floatAnim = isBlackout ? "floatIntense" : "float";

  const rotations = useMemo(
    () =>
      burstDelays.map(() =>
        isBlackout ? Math.floor(Math.random() * 31) - 15 : 0,
      ),
    [kind],
  );

  return (
    <button
      onClick={onClose}
      className="fixed inset-0 z-50 bg-navy/95 backdrop-blur-sm flex flex-col items-center justify-center px-6 text-center"
      aria-label="Dismiss celebration"
    >
      <div className="flex items-center justify-center gap-3 mb-4">
        {burstDelays.map((delay, i) => (
          <span
            key={i}
            className="inline-block"
            style={{ transform: `rotate(${rotations[i]}deg)` }}
          >
            <span
              className={`${emojiSize} inline-block`}
              style={{
                animation: `fireworkBurst 600ms cubic-bezier(.2,.9,.3,1.2) ${delay}ms both, ${floatAnim} 2s ease-in-out ${delay + 600}ms infinite`,
              }}
            >
              🎆
            </span>
          </span>
        ))}
      </div>

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
