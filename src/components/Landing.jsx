const STEPS = [
  {
    num: "1",
    title: "Start a game, get a code",
    desc: "Takes three seconds. Share the 6-character code with anyone joining you on the call.",
  },
  {
    num: "2",
    title: "Everyone gets their own card",
    desc: "Each player gets a randomized bingo card loaded with phrases from real calls. No two cards are the same.",
  },
  {
    num: "3",
    title: "Tap when you hear it",
    desc: "Live on the call, tap a square the moment you hear the phrase. Your colleagues are doing the same.",
  },
  {
    num: "4",
    title: "First to bingo wins",
    desc: "Five in a row and you're done. Bragging rights are real. So is the leaderboard.",
  },
];

export default function Landing({ onPickCompany }) {
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

      <main className="flex-1 flex flex-col items-center px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="rounded-2xl border border-gold/30 px-5 py-4 text-center">
            <p className="text-sm text-gold leading-relaxed">
              Play live with your colleagues during the call. Same moment.
              First to bingo wins.
            </p>
          </div>

          <div className="border-t border-gold/20" />

          <div className="space-y-5">
            <p className="text-[10px] uppercase tracking-[0.32em] text-gold/60 text-center">
              How It Works
            </p>
            <h2 className="font-display text-xl font-bold text-cream text-center">
              You and your colleagues. One call. One winner.
            </h2>
            <p className="text-sm italic text-cream/50 text-center">
              No setup. No accounts. Just a code.
            </p>

            <div className="space-y-3">
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className="rounded-xl bg-navy-2/80 border border-cream/10 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.num}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-cream">
                        {step.title}
                      </div>
                      <p className="mt-1 text-xs text-cream/50 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gold/20" />

          <div className="text-center space-y-3 pb-4">
            <h2 className="font-display text-xl font-bold text-cream">
              Ready to play?
            </h2>
            <p className="text-sm italic text-cream/50">
              Choose a company to get started.
            </p>
            <button
              onClick={onPickCompany}
              className="w-full rounded-2xl bg-gold py-3 font-semibold text-navy tracking-wide active:bg-gold-bright active:scale-[0.99] transition"
            >
              Pick a Company &rarr;
            </button>
          </div>
        </div>
      </main>

      <footer className="pb-8 text-center">
        <p className="text-xs text-cream/40 max-w-sm mx-auto px-4 pb-[env(safe-area-inset-bottom)]">
          Independent hobby project for entertainment purposes. Not affiliated
          with any company included. No gambling, please. Just the same phrases
          you've heard a bunch of times on these calls, finally on a bingo card.
          May improve your listening skills. Don't sue us. 😊
        </p>
      </footer>
    </div>
  );
}
