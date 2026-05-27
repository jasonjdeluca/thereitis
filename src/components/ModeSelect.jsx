export default function ModeSelect({ company, onBingo, onTrivia, onBack }) {
  return (
    <div className="bg-radial-navy min-h-full flex flex-col">
      <header className="pt-10 pb-6 px-6 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-cream">
          There It Is<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.32em] text-cream/60">
          Earnings Call Bingo
        </p>
        <div className="mt-3">
          <div className="font-display text-lg font-bold text-cream">
            {company.name}
          </div>
          <div className="text-sm italic text-cream/50">
            {company.call_identifier || "Next call not yet scheduled"}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-full max-w-sm space-y-5">
          <button
            onClick={onBingo}
            className="group w-full rounded-3xl bg-navy-2/80 backdrop-blur border border-gold/40 p-6 text-left shadow-2xl hover:border-gold/60 active:scale-[0.99] transition"
          >
            <div className="text-3xl mb-3">🎯</div>
            <div className="font-display text-xl font-bold text-cream">
              Play Bingo
            </div>
            <p className="mt-2 text-sm text-cream/60 leading-relaxed">
              Join a live session during the call. Tap squares
              as you hear the phrases. First to bingo wins.
            </p>
            <div className="mt-4 rounded-2xl bg-gold py-3 text-center font-semibold text-navy tracking-wide group-active:bg-gold-bright transition">
              Start a Game &rarr;
            </div>
          </button>

          <div className="w-full rounded-3xl bg-navy-2/80 backdrop-blur border border-cream/10 p-6 text-left">
            <p className="text-xs uppercase tracking-[0.32em] text-gold/60 mb-2">
              Call Trivia
            </p>
            <h3 className="font-display text-lg font-bold text-cream">
              🧠 Think you were paying attention?
            </h3>
            <p className="mt-2 text-sm italic text-cream/50">
              Every question pulled from real calls. No spreadsheets required.
            </p>
            <button
              onClick={onTrivia}
              className="mt-4 w-full rounded-2xl border border-gold/60 bg-gold/10 text-cream py-3 text-base font-semibold active:scale-[0.99] transition hover:bg-gold/20"
            >
              Test Your Knowledge &rarr;
            </button>
          </div>
        </div>
      </main>

      <footer className="pb-8 text-center pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={onBack}
          className="text-cream/40 text-xs uppercase tracking-[0.3em] py-2 active:text-cream transition"
        >
          &larr; Back
        </button>
      </footer>
    </div>
  );
}
