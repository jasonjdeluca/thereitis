import { useState } from "react";
import { TIER } from "../lib/phrases";
import { supabase } from "../lib/supabase";

function sizeClass(phrase) {
  const len = phrase.length;
  if (len <= 8) return "text-[12px] leading-tight";
  if (len <= 12) return "text-[11px] leading-tight";
  if (len <= 16) return "text-[10px] leading-tight";
  return "text-[9px] leading-snug";
}

export default function Predictions({ card, playerId, onConfirm, onSkip }) {
  const [selected, setSelected] = useState([]);

  function toggleCell(phrase) {
    if (selected.includes(phrase)) {
      setSelected(selected.filter((p) => p !== phrase));
    } else if (selected.length < 3) {
      setSelected([...selected, phrase]);
    }
  }

  async function handleConfirm() {
    await supabase
      .from("players")
      .update({ predictions: selected })
      .eq("id", playerId);
    onConfirm(selected);
  }

  return (
    <div className="bg-radial-navy min-h-full flex flex-col pb-24">
      <header className="pt-6 pb-3 px-5 text-center">
        <h2 className="font-display font-bold text-cream text-lg">
          Pick 3 phrases you think will be said today
        </h2>
        <div className="mt-2 text-sm text-cream/60">
          {selected.length} of 3 picked
        </div>
      </header>

      <main className="px-3 sm:px-5 flex-1 flex flex-col items-center">
        <div className="w-full max-w-md rounded-2xl bg-navy-2/40 p-2 border border-cream/5">
          <div className="grid grid-cols-5 gap-1.5">
            {card.map((row, r) =>
              row.map((cell, c) => {
                const isSelected = selected.includes(cell.phrase);
                const isFree = cell.isFree;
                const dot = TIER[cell.tier]?.dot || "";

                const stateClasses = isFree
                  ? "bg-cream text-navy font-bold"
                  : isSelected
                    ? "bg-purple-500 text-white font-semibold ring-2 ring-purple-300"
                    : "bg-cream text-navy/90 hover:bg-cream/90 active:scale-95";

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => !isFree && toggleCell(cell.phrase)}
                    disabled={isFree}
                    className={`relative aspect-square rounded-lg flex items-center justify-center text-center px-1 py-1 select-none touch-manipulation transition-all duration-200 break-words ${stateClasses}`}
                  >
                    {!isFree && (
                      <span className="absolute top-0.5 left-1 text-[9px] opacity-70" aria-hidden>
                        {dot}
                      </span>
                    )}
                    {isFree ? (
                      <span className="flex flex-col items-center justify-center leading-tight">
                        <span className="text-2xl" aria-hidden>🏨</span>
                        <span className="text-[11px] font-bold tracking-wider mt-0.5">FREE</span>
                      </span>
                    ) : (
                      <span className={`${sizeClass(cell.phrase)} font-medium px-0.5`}>
                        {cell.phrase}
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute top-0.5 right-0.5 text-[10px]">🔮</span>
                    )}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-navy-2/95 backdrop-blur border-t border-cream/10 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onSkip}
            className="flex-1 rounded-2xl border border-cream/20 text-cream/60 py-3 font-semibold active:scale-[0.99]"
          >
            Skip
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.length !== 3}
            className="flex-1 rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99] disabled:opacity-40"
          >
            Confirm Predictions
          </button>
        </div>
      </div>
    </div>
  );
}
