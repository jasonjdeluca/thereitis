import { useEffect, useState } from "react";
import { BADGE_DEFS } from "../lib/badges";

export default function BadgeReveal({ badgeIds }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!badgeIds || badgeIds.length === 0) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= badgeIds.length) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [badgeIds]);

  if (!badgeIds || badgeIds.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-cream/50 mb-3 text-center">
        You earned {badgeIds.length} badge{badgeIds.length !== 1 ? "s" : ""} this
        session!
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {badgeIds.slice(0, visibleCount).map((id, i) => {
          const badge = BADGE_DEFS[id];
          if (!badge) return null;
          return (
            <div
              key={id}
              className="animate-badgeIn flex flex-col items-center gap-1 rounded-xl border border-gold/60 bg-navy-2/90 px-3 py-2 min-w-[72px]"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-2xl">{badge.emoji}</span>
              <span className="text-[10px] text-cream font-semibold text-center leading-tight">
                {badge.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
