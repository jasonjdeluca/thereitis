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
    title: "Bingo, blackout, bragging rights.",
    desc: "Keep marking until the call ends — the leaderboard tells the whole story.",
  },
];

function MobileLanding({ onPickCompany }) {
  return (
    <div className="bg-radial-navy min-h-full flex flex-col lg:hidden">
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

function DesktopLanding({ onPickCompany }) {
  return (
    <div className="hidden lg:flex flex-col min-h-full bg-radial-navy">
      {/* Nav */}
      <nav className="w-full px-12 py-5 border-b border-gold/10">
        <h1 className="font-display text-2xl font-black tracking-tight text-cream">
          There It Is<span className="text-gold">.</span>
        </h1>
      </nav>

      {/* Hero */}
      <section className="w-full text-center pt-16 pb-14 border-b border-gold/10">
        <p className="text-[11px] uppercase tracking-[0.4em] text-gold font-semibold mb-6">
          Earnings Call Bingo
        </p>
        <h2 className="font-display text-5xl font-black text-cream leading-tight">
          Every quarter,<br />right on <span className="text-gold">cue.</span>
        </h2>
        <p className="mt-6 text-base text-cream/50 max-w-lg mx-auto leading-relaxed">
          Play live with your colleagues during the call. Everyone gets their own
          card. Tap when you hear the phrase. The leaderboard tells the whole story.
        </p>
        <button
          onClick={onPickCompany}
          className="mt-8 rounded-2xl bg-gold px-8 py-3 font-semibold text-navy tracking-wide hover:bg-gold-bright active:scale-[0.99] transition"
        >
          Pick a Company &rarr;
        </button>
      </section>

      {/* How It Works */}
      <section className="w-full px-12 py-12 border-b border-gold/10">
        <p className="text-[11px] uppercase tracking-[0.4em] text-gold font-semibold mb-4">
          How It Works
        </p>
        <h3 className="font-display text-2xl font-bold text-cream mb-10">
          You and your colleagues. One call. Let's see who was listening.
        </h3>
        <div className="grid grid-cols-4 gap-5">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="rounded-xl bg-[#111f35] border border-cream/10 p-5"
            >
              <span className="w-8 h-8 rounded-full bg-gold/20 text-gold text-sm font-bold flex items-center justify-center mb-4">
                {step.num}
              </span>
              <div className="font-semibold text-cream text-sm mb-2">
                {step.title}
              </div>
              <p className="text-xs text-cream/50 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Where This Came From */}
      <section className="w-full px-12 py-12 border-b border-gold/10">
        <div className="grid grid-cols-3 gap-12">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-gold font-semibold mb-4">
              Where This Came From
            </p>
            <h3 className="font-display text-2xl font-bold text-cream leading-snug">
              If you listen closely enough, you start to hear it.
            </h3>
          </div>
          <div className="col-span-2 space-y-5 text-sm text-[#8899bb] leading-[1.8]">
            <p>
              If you've listened to enough earnings calls, you start to notice
              something. Some of the same phrases reappear. They follow a similar
              cadence from call to call.
            </p>
            <p>
              This game started with that observation. AI agents scraped years of
              publicly available transcripts — across multiple calls, multiple
              companies, multiple market cycles — and did what AI does well: found
              the patterns. Not guesses about what gets said. Actual language,
              detected across pages and pages of call transcripts, ranked by how
              reliably it shows up.
            </p>
            <p>
              The same AI then built the game. The phrases, the trivia questions,
              the scoring, the code — all of it generated and assembled by the
              tools, pointed at an opportunity someone noticed.
            </p>
            <p>
              The hope is simple: that somewhere, on a Tuesday morning, someone on
              a dial-in with colleagues smiles when they hear{" "}
              <span className="text-gold">"lift up above the noise"</span> for
              the third time — and quietly taps their card.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-12 py-5 text-center">
        <p className="text-[11px] text-[#334455]">
          Independent hobby project for entertainment purposes. Not affiliated
          with any company included. No gambling, please. Just the same phrases
          you've heard a bunch of times on these calls, finally on a bingo card.
          May improve your listening skills. Don't sue us. 😊
        </p>
      </footer>
    </div>
  );
}

export default function Landing({ onPickCompany }) {
  return (
    <>
      <MobileLanding onPickCompany={onPickCompany} />
      <DesktopLanding onPickCompany={onPickCompany} />
    </>
  );
}
