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
    desc: "Live on the call, tap a square the moment you hear the phrase. Everyone else is doing the same.",
  },
  {
    num: "4",
    title: "Bingo, blackout, bragging rights.",
    desc: "Keep marking until the call ends — the leaderboard tells the whole story.",
  },
];

function MobileLanding({ onPickCompany }) {
  return (
    <div
      className="min-h-full flex flex-col lg:hidden overflow-hidden"
      style={{
        backgroundImage: "url('/call-bingo-hero-bg-mobile-clean-1170x1800.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        minHeight: '480px',
      }}
    >
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
              Play live during the call with anyone who's listening. Same moment.
              Same card. Let's see who heard it first.
            </p>
          </div>

          <div className="border-t border-gold/20" />

          <div className="space-y-5">
            <p className="text-[10px] uppercase tracking-[0.32em] text-gold/60 text-center">
              How It Works
            </p>
            <h2 className="font-display text-xl font-bold text-cream text-center">
              You and others on the line. One call. Let's see who was listening.
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

          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.32em] text-gold/60 text-center">
              Where This Came From
            </p>
            <h2 className="font-display text-lg font-bold text-cream text-center leading-snug">
              If you listen closely enough, you start to hear it.
            </h2>
            <div className="space-y-4 text-sm text-[#8899bb] leading-[1.8]">
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
                a dial-in smiles when they hear{" "}
                <span className="text-gold">"lift up above the noise"</span> for
                the third time — and quietly taps their card.
              </p>
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

          <div className="border-t border-gold/20" />

          {/* Fake Press Strip — mobile (3 outlets) */}
          <div className="text-center space-y-4">
            <p className="text-sm italic text-cream/30">
              Not featured in, endorsed by, or even aware of:
            </p>
            <div className="flex items-center justify-center gap-8">
              {/* Early Morning Show */}
              <div className="flex flex-col items-center opacity-75">
                <svg width="28" height="16" viewBox="0 0 28 16" fill="none" className="mb-1.5">
                  <path d="M14 12 A10 10 0 0 1 4 12" stroke="#667788" strokeWidth="1.5" fill="none" />
                  <line x1="14" y1="2" x2="14" y2="6" stroke="#667788" strokeWidth="1.5" />
                  <line x1="8" y1="4" x2="10" y2="7" stroke="#667788" strokeWidth="1.5" />
                  <line x1="20" y1="4" x2="18" y2="7" stroke="#667788" strokeWidth="1.5" />
                  <line x1="5" y1="8" x2="8" y2="9" stroke="#667788" strokeWidth="1.5" />
                  <line x1="23" y1="8" x2="20" y2="9" stroke="#667788" strokeWidth="1.5" />
                </svg>
                <span className="text-[10px] text-[#667788] font-serif leading-tight text-center">Early<br/>Morning<br/>Show</span>
              </div>

              {/* The Daily Ledger */}
              <div className="flex flex-col items-center opacity-75">
                <div className="border-t border-[#667788] w-20 mb-1" />
                <span className="text-[8px] tracking-[0.3em] text-[#667788] uppercase">The</span>
                <span className="text-base font-bold font-serif text-[#667788] leading-tight">DAILY LEDGER</span>
                <div className="border-t border-[#667788] w-20 mt-1 mb-1" />
                <span className="text-[#667788] text-[10px] leading-none">◆</span>
              </div>

              {/* Prestige Business Weekly */}
              <div className="flex flex-col items-center opacity-75">
                <span className="text-[#667788] text-sm mb-0.5">♛</span>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="border-t border-[#667788] w-6" />
                  <span className="text-[9px] tracking-[0.25em] text-[#667788] font-serif uppercase">Prestige</span>
                  <div className="border-t border-[#667788] w-6" />
                </div>
                <span className="text-[8px] tracking-[0.2em] text-[#667788] uppercase">Business Weekly</span>
              </div>
            </div>
            <p className="text-xs italic text-cream/25">We remain hopeful.</p>
          </div>
        </div>
      </main>

      <footer className="pb-8 text-center">
        <p className="text-xs text-cream/40 max-w-sm mx-auto px-4">
          Independent hobby project for entertainment purposes. Not affiliated
          with any company included. No gambling, please. Just the same phrases
          you've heard a bunch of times on these calls, finally on a bingo card.
          May improve your listening skills. Don't sue us. 😊
        </p>
        <div className="mt-4 flex justify-center pb-[env(safe-area-inset-bottom)]">
          <span
            className="inline-flex items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.04]"
            style={{ padding: "6px 14px 6px 8px" }}
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <style>{`@keyframes blink{0%,88%,100%{opacity:1}90%,96%{opacity:0}}.eye{animation:blink 4s ease-in-out infinite}`}</style>
              <rect width="20" height="20" rx="4" fill="#1a0f0a" />
              <rect x="4" y="5" width="12" height="8" fill="#C96442" />
              <rect x="2" y="8" width="2" height="3" fill="#C96442" />
              <rect x="16" y="8" width="2" height="3" fill="#C96442" />
              <rect x="6" y="6" width="2" height="3" fill="#1a0f0a" className="eye" />
              <rect x="12" y="6" width="2" height="3" fill="#1a0f0a" className="eye" />
              <rect x="5" y="13" width="2" height="2" fill="#C96442" />
              <rect x="9" y="13" width="2" height="2" fill="#C96442" />
              <rect x="13" y="13" width="2" height="2" fill="#C96442" />
            </svg>
            <span className="text-[11px]">
              <span className="text-[#667788]">Built by </span>
              <span className="text-[#C96442] font-bold">Claude Code</span>
            </span>
          </span>
        </div>
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
      <section
        className="w-full text-center py-28 lg:py-32 border-b border-gold/10 flex flex-col items-center justify-center"
        style={{
          backgroundImage: "url('/call-bingo-hero-bg-desktop-clean-2400x900.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          overflow: 'hidden',
          minHeight: '520px',
        }}
      >
        <p className="text-[11px] uppercase tracking-[0.4em] text-gold font-semibold mb-6">
          Earnings Call Bingo
        </p>
        <h2 className="font-display text-5xl font-black text-cream leading-tight">
          Every quarter,<br />right on <span className="text-gold">cue.</span>
        </h2>
        <p className="mt-6 text-base text-cream/50 max-w-lg mx-auto leading-relaxed">
          Play live during the call. Everyone gets their own
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
          You and others on the line. One call. Let's see who was listening.
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
              a dial-in smiles when they hear{" "}
              <span className="text-gold">"lift up above the noise"</span> for
              the third time — and quietly taps their card.
            </p>
          </div>
        </div>
      </section>

      {/* Fake Press Strip */}
      <section className="w-full border-t border-gold/20">
        <div className="px-12 py-9 text-center">
          <p className="text-sm italic text-cream/30 mb-8">
            Not featured in, endorsed by, or even aware of:
          </p>
          <div className="flex items-center justify-center gap-12 max-w-4xl mx-auto">
            {/* Early Morning Show */}
            <div className="flex flex-col items-center opacity-75">
              <svg width="28" height="16" viewBox="0 0 28 16" fill="none" className="mb-1.5">
                <path d="M14 12 A10 10 0 0 1 4 12" stroke="#667788" strokeWidth="1.5" fill="none" />
                <line x1="14" y1="2" x2="14" y2="6" stroke="#667788" strokeWidth="1.5" />
                <line x1="8" y1="4" x2="10" y2="7" stroke="#667788" strokeWidth="1.5" />
                <line x1="20" y1="4" x2="18" y2="7" stroke="#667788" strokeWidth="1.5" />
                <line x1="5" y1="8" x2="8" y2="9" stroke="#667788" strokeWidth="1.5" />
                <line x1="23" y1="8" x2="20" y2="9" stroke="#667788" strokeWidth="1.5" />
              </svg>
              <span className="text-[10px] text-[#667788] font-serif leading-tight text-center">Early<br/>Morning<br/>Show</span>
            </div>

            {/* The Daily Ledger */}
            <div className="flex flex-col items-center opacity-75">
              <div className="border-t border-[#667788] w-20 mb-1" />
              <span className="text-[8px] tracking-[0.3em] text-[#667788] uppercase">The</span>
              <span className="text-base font-bold font-serif text-[#667788] leading-tight">DAILY LEDGER</span>
              <div className="border-t border-[#667788] w-20 mt-1 mb-1" />
              <span className="text-[#667788] text-[10px] leading-none">◆</span>
            </div>

            {/* Prestige Business Weekly */}
            <div className="flex flex-col items-center opacity-75">
              <span className="text-[#667788] text-sm mb-0.5">♛</span>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="border-t border-[#667788] w-6" />
                <span className="text-[9px] tracking-[0.25em] text-[#667788] font-serif uppercase">Prestige</span>
                <div className="border-t border-[#667788] w-6" />
              </div>
              <span className="text-[8px] tracking-[0.2em] text-[#667788] uppercase">Business Weekly</span>
            </div>

            {/* Market Feelings Daily — hidden on mobile */}
            <div className="hidden xl:flex flex-col items-center opacity-75">
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="mb-1">
                <rect x="2" y="8" width="4" height="8" fill="#667788" />
                <rect x="8" y="4" width="4" height="12" fill="#667788" />
                <rect x="14" y="0" width="4" height="16" fill="#667788" />
              </svg>
              <span className="text-[11px] font-bold font-serif text-[#667788] leading-tight text-center">Market<br/>Feelings</span>
              <span className="text-[8px] text-[#667788] tracking-[0.15em]">— DAILY —</span>
            </div>

            {/* Morning Desk Live — hidden on mobile */}
            <div className="hidden xl:flex flex-col items-center opacity-75">
              <span className="text-xs font-bold text-[#667788] uppercase tracking-wide">Morning Desk</span>
              <span className="mt-1 text-[8px] bg-[#667788]/20 text-[#667788] px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">Live</span>
            </div>

            {/* The Respected-Looking Times — hidden on mobile */}
            <div className="hidden xl:flex flex-col items-center opacity-75">
              <div className="border-t border-b border-[#667788] w-24 py-px mb-1">
                <div className="border-t border-[#667788]" />
              </div>
              <span className="text-[8px] tracking-[0.3em] text-[#667788] uppercase">The</span>
              <span className="text-[11px] font-serif italic text-[#667788] leading-tight">Respected-Looking</span>
              <span className="text-[9px] tracking-[0.25em] text-[#667788] uppercase">Times</span>
              <div className="border-t border-b border-[#667788] w-24 py-px mt-1">
                <div className="border-t border-[#667788]" />
              </div>
            </div>
          </div>
          <p className="mt-8 text-xs italic text-cream/25">We remain hopeful.</p>
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
        <div className="mt-4 flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.04]"
            style={{ padding: "6px 14px 6px 8px" }}
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <style>{`@keyframes blink{0%,88%,100%{opacity:1}90%,96%{opacity:0}}.eye{animation:blink 4s ease-in-out infinite}`}</style>
              <rect width="20" height="20" rx="4" fill="#1a0f0a" />
              <rect x="4" y="5" width="12" height="8" fill="#C96442" />
              <rect x="2" y="8" width="2" height="3" fill="#C96442" />
              <rect x="16" y="8" width="2" height="3" fill="#C96442" />
              <rect x="6" y="6" width="2" height="3" fill="#1a0f0a" className="eye" />
              <rect x="12" y="6" width="2" height="3" fill="#1a0f0a" className="eye" />
              <rect x="5" y="13" width="2" height="2" fill="#C96442" />
              <rect x="9" y="13" width="2" height="2" fill="#C96442" />
              <rect x="13" y="13" width="2" height="2" fill="#C96442" />
            </svg>
            <span className="text-[11px]">
              <span className="text-[#667788]">Built by </span>
              <span className="text-[#C96442] font-bold">Claude Code</span>
            </span>
          </span>
        </div>
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
