import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Overrides for companies whose DB id is not their stock ticker
const TICKERS = {
  hilton: "HLT",
  marriott: "MAR",
  hyatt: "H",
  ihg: "IHG",
  wyndham: "WH",
  choice: "CHH",
};

const LIVE_BEFORE_MS = 15 * 60 * 1000;
const LIVE_AFTER_MS = 3 * 60 * 60 * 1000;

function isLive(nextEarningsDate) {
  if (!nextEarningsDate) return false;
  const now = Date.now();
  const target = new Date(nextEarningsDate).getTime();
  return now >= target - LIVE_BEFORE_MS && now <= target + LIVE_AFTER_MS;
}

function CountdownDisplay({ nextEarningsDate }) {
  const [display, setDisplay] = useState("");
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!nextEarningsDate) {
      setDisplay(null);
      setLive(false);
      return;
    }

    function tick() {
      if (isLive(nextEarningsDate)) {
        setLive(true);
        setDisplay(null);
        return;
      }

      setLive(false);
      const now = Date.now();
      const target = new Date(nextEarningsDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setDisplay("Call Complete");
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);

      setDisplay(`${days} days · ${hours} hours · ${minutes} minutes`);
    }

    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [nextEarningsDate]);

  if (!nextEarningsDate) {
    return <span className="text-cream/40">&mdash; Coming Soon</span>;
  }

  if (live) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-900/40 border border-red-500/40 px-2.5 py-0.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-red-500 animate-livePulse" />
          <span className="relative rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-red-400 text-[11px] font-semibold tracking-wide uppercase">Live</span>
      </span>
    );
  }

  if (display === "Call Complete") {
    return <span className="text-cream/40">Call Complete</span>;
  }

  return <span className="text-gold">{display}</span>;
}

export default function CompanySelect({ onSelectCompany, onBack }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (cancelled) return;

      if (data) {
        // Live calls surface first, then alphabetical
        const sorted = [...data].sort((a, b) => {
          const aLive = isLive(a.next_earnings_date) ? 0 : 1;
          const bLive = isLive(b.next_earnings_date) ? 0 : 1;
          return aLive - bLive || a.name.localeCompare(b.name);
        });
        setCompanies(sorted);
      }
      setLoading(false);
    }

    load();

    // Reload full list on any company change (activation, deactivation, date update)
    const channel = supabase
      .channel("companies-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "companies" },
        load,
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="bg-radial-navy min-h-full flex flex-col">
      <header className="pt-10 pb-6 px-6 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-cream">
          There It Is<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.32em] text-cream/60">
          Pick a Company
        </p>
      </header>

      <main className="flex-1 px-6 pb-10">
        <div className="max-w-sm mx-auto">
          {loading ? (
            <div className="text-cream/40 text-sm text-center py-10">
              Loading companies...
            </div>
          ) : (
            <div className="space-y-0">
              {companies.map((company, i) => {
                const live = isLive(company.next_earnings_date);
                const ticker = TICKERS[company.id] || company.id.toUpperCase();
                return (
                  <div key={company.id}>
                    {i > 0 && (
                      <div className="border-t border-gold/20 my-0" />
                    )}
                    <div className="py-5">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl leading-none select-none" aria-hidden>
                          {company.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-xl font-bold text-cream">
                            {company.name}{" "}
                            <span className="text-cream/40 font-sans text-sm font-normal">
                              ({ticker})
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-cream/60">
                            {company.call_identifier || "Next call not yet scheduled"}
                          </div>
                          <div className="mt-2 text-xs">
                            <CountdownDisplay nextEarningsDate={company.next_earnings_date} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        {company.phrase_count >= 50 ? (
                          <button
                            onClick={() => onSelectCompany(company)}
                            className="w-full rounded-2xl bg-gold py-3 text-center font-semibold text-navy tracking-wide active:bg-gold-bright active:scale-[0.99] transition"
                          >
                            {live ? "Join the Live Call" : "Start a Game"} &rarr;
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full rounded-2xl bg-cream/10 py-3 text-center font-semibold text-cream/30 tracking-wide cursor-not-allowed"
                          >
                            Phrases Not Ready
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={onBack}
            className="w-full mt-6 text-cream/40 text-xs uppercase tracking-[0.3em] py-2 active:text-cream transition"
          >
            &larr; Back
          </button>
        </div>
      </main>
    </div>
  );
}
