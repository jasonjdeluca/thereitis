import { useState } from "react";
import { TIER } from "../lib/phrases";
import { supabase } from "../lib/supabase";

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

export default function Predictions({ card, playerId, onConfirm, onSkip }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState([]);

  function toggleCell(phrase) {
    if (selected.includes(phrase)) {
      setSelected(selected.filter((p) => p !== phrase));
    } else if (selected.length < 3) {
      setSelected([...selected, phrase]);
    }
  }

  async function handleLockIn() {
    await supabase
      .from("players")
      .update({ predictions: selected })
      .eq("id", playerId);
    onConfirm(selected);
  }

  if (step === 1) {
    return (
      <div className="bg-radial-navy min-h-full flex flex-col items-center justify-center px-6 pt-12 pb-16 sm:pt-16 sm:pb-20">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="text-6xl">🔮</div>

          <h2 className="font-display font-bold text-2xl text-gold">
            Before the call starts
          </h2>

          <p className="text-cream text-sm leading-relaxed">
            Pick 3 phrases you think will actually get said today.
            When you're right, your card will show it — and you'll
            earn bonus points.
          </p>

          <div className="space-y-2 text-left text-sm text-cream/80">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>+200 points per correct prediction</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>All 3 correct = Psychic badge 🔮 + 1,000 bonus</span>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99] transition"
          >
            Make My Predictions →
          </button>

          <button
            onClick={onSkip}
            className="text-cream/40 text-xs active:text-cream transition"
          >
            Skip — just play
          </button>
        </div>
      </div>
    );
  }

  const placeholders = ["—", "—", "—"];
  selected.forEach((phrase, i) => {
    placeholders[i] = phrase;
  });

  return (
    <div className="bg-radial-navy min-h-full flex flex-col pb-36">
      <header className="pt-6 pb-3 px-5 text-center">
        <h2 className="font-display font-bold text-gold text-lg">
          Tap 3 phrases you predict will be said
        </h2>
        <div className="mt-2 text-sm text-cream/60">
          {selected.length} of 3 selected
        </div>
      </header>

      <main className="px-3 sm:px-5 flex-1 flex flex-col items-center">
        <div className="w-full max-w-md rounded-2xl bg-navy-2/40 p-2 border border-cream/5">
          <div className="grid grid-cols-5 gap-1.5">
            {card.map((row, r) =>
              row.map((cell, c) => {
                const isSelected = selected.includes(cell.phrase);
                const isFree = cell.isFree;
                const canSelect =
                  !isFree && (isSelected || selected.length < 3);

                const stateClasses = isFree
                  ? "bg-cream text-navy font-bold"
                  : isSelected
                    ? "bg-purple-500 text-white font-semibold ring-2 ring-purple-300"
                    : canSelect
                      ? "bg-cream text-navy/90 hover:bg-cream/90 active:scale-95 ring-2 ring-purple-400/50 animate-pulse-subtle"
                      : "bg-cream/60 text-navy/50";

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => canSelect && toggleCell(cell.phrase)}
                    disabled={isFree || !canSelect}
                    className={`relative aspect-square rounded-lg flex items-center justify-center text-center px-1 py-1 select-none touch-manipulation transition-all duration-200 break-words ${stateClasses}`}
                  >
                    {isFree ? (
                      <span className="flex flex-col items-center justify-center leading-tight">
                        <span className="text-2xl" aria-hidden>
                          🏨
                        </span>
                        <span className="text-[11px] font-bold tracking-wider mt-0.5">
                          FREE
                        </span>
                      </span>
                    ) : (
                      <span
                        className={`${sizeClass(cell.phrase)} font-medium px-0.5`}
                      >
                        {cell.phrase}
                      </span>
                    )}
                    {isSelected && (
                      <span
                        className="absolute top-0.5 right-0.5 text-[10px]"
                        aria-hidden
                      >
                        🔮
                      </span>
                    )}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-navy-2/95 backdrop-blur border-t border-cream/10 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 pt-3 pb-2">
          <div className="flex items-center justify-center gap-3 mb-3">
            {placeholders.map((p, i) => (
              <div
                key={i}
                className={`flex-1 text-center text-[10px] truncate rounded-lg px-2 py-1.5 border ${
                  p === "—"
                    ? "border-cream/10 text-cream/30"
                    : "border-purple-400/60 text-purple-200 bg-purple-500/10"
                }`}
              >
                {p}
              </div>
            ))}
          </div>
          <button
            onClick={handleLockIn}
            disabled={selected.length !== 3}
            className="w-full rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99] transition disabled:opacity-30 disabled:bg-cream/20 disabled:text-cream/40"
          >
            {selected.length === 3
              ? "Lock In My Predictions"
              : `Select ${3 - selected.length} more`}
          </button>
        </div>
      </div>
    </div>
  );
}
