import { useState } from "react";

export default function LiveFeed({ entries }) {
  const [collapsed, setCollapsed] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className="fixed top-16 right-2 z-20 w-64 sm:w-72">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between bg-navy-2/90 backdrop-blur border border-cream/10 rounded-t-xl px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-cream/60"
      >
        <span>Live Feed</span>
        <span>{collapsed ? "▼" : "▲"}</span>
      </button>
      {!collapsed && (
        <div className="bg-navy-2/90 backdrop-blur border border-t-0 border-cream/10 rounded-b-xl px-3 py-2 space-y-1.5 max-h-48 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="text-xs text-cream/80 animate-toastIn">
              {entry.type === "bingo" ? (
                <span>
                  <span className="font-semibold text-gold">
                    {entry.playerName}
                  </span>{" "}
                  got BINGO! 🎉
                </span>
              ) : (
                <span>
                  <span className="font-semibold text-cream">
                    {entry.playerName}
                  </span>{" "}
                  marked{" "}
                  <span className="text-gold">{entry.phrase}</span> 🔥
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
