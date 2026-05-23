export default function Landing({ onStart }) {
  return (
    <div className="bg-radial-navy min-h-full flex flex-col">
      <header className="pt-10 pb-6 px-6 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-cream">
          There It Is<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.32em] text-cream/60">
          Earnings Call Bingo
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <button
          onClick={onStart}
          className="group w-full max-w-sm rounded-3xl bg-navy-2/80 backdrop-blur border border-cream/10 p-6 text-left shadow-2xl hover:border-gold/60 active:scale-[0.99] transition"
        >
          <div className="flex items-start gap-4">
            <div className="text-5xl leading-none select-none" aria-hidden>
              🏨
            </div>
            <div className="flex-1">
              <div className="font-display text-3xl font-bold text-cream">
                Hilton
              </div>
              <div className="mt-1 text-sm text-cream/60">
                Q2 2026 Earnings Call
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-gold py-3 text-center font-semibold text-navy tracking-wide group-active:bg-gold-bright transition">
            Start Game
          </div>
        </button>
      </main>

      <footer className="pb-8 text-center text-[10px] uppercase tracking-[0.28em] text-cream/30">
        tap to mark phrases as they're said
      </footer>
    </div>
  );
}
