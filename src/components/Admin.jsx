// NOTE: VITE_ADMIN_PASSWORD is no longer used — delete it from Vercel environment variables.
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const COMPANY_ORDER = ["hilton", "marriott", "hyatt", "ihg", "wyndham", "choice"];

function Countdown({ targetDate, timezone }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!targetDate) {
      setDisplay("Coming Soon");
      return;
    }

    function tick() {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setDisplay("Call Complete");
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (days > 0) {
        setDisplay(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setDisplay(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setDisplay(`${minutes}m ${seconds}s`);
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div className="rounded-xl bg-navy-2/60 border border-gold/20 p-4 text-center">
      <div className="text-[10px] uppercase tracking-[0.3em] text-cream/50 mb-1">
        Countdown Preview
      </div>
      <div className="font-mono text-2xl text-gold font-bold">{display}</div>
      {timezone && (
        <div className="text-[10px] text-cream/40 mt-1">{timezone}</div>
      )}
    </div>
  );
}

function GateForm({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError("Invalid credentials");
    } else {
      onAuth();
    }
  }

  return (
    <div className="bg-radial-navy min-h-full flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs space-y-6 text-center">
        <div>
          <h1 className="font-display text-3xl font-black text-cream">
            There It Is<span className="text-gold">.</span>
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-gold/60">
            Admin
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-xl bg-navy-2/80 border border-cream/10 text-cream px-4 py-3 text-lg placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-xl bg-navy-2/80 border border-cream/10 text-cream px-4 py-3 text-lg placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99] transition disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CompanyStats({ companyId, callIdentifier }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const twentyFourAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();

      const [recentRes, totalSessionsRes, allSessionsRes] =
        await Promise.all([
          supabase
            .from("sessions")
            .select("id", { count: "exact", head: true })
            .eq("company_id", companyId)
            .gte("started_at", twentyFourAgo),
          supabase
            .from("sessions")
            .select("id", { count: "exact", head: true })
            .eq("company_id", companyId),
          supabase
            .from("sessions")
            .select("id")
            .eq("company_id", companyId),
        ]);

      const sessionIds = allSessionsRes.data?.map((s) => s.id) || [];
      let totalPlayers = 0;
      if (sessionIds.length > 0) {
        const { count } = await supabase
          .from("players")
          .select("id", { count: "exact", head: true })
          .in("session_id", sessionIds);
        totalPlayers = count || 0;
      }

      let topPhrase = "—";
      let topCount = 0;
      if (callIdentifier && sessionIds.length > 0) {
        const { data: callSessions } = await supabase
          .from("sessions")
          .select("id")
          .eq("company_id", companyId)
          .eq("call_identifier", callIdentifier);

        const callSessionIds = callSessions?.map((s) => s.id) || [];
        if (callSessionIds.length > 0) {
          const { data: marks } = await supabase
            .from("marks")
            .select("phrase")
            .in("session_id", callSessionIds);

          if (marks && marks.length > 0) {
            const counts = {};
            marks.forEach((m) => {
              counts[m.phrase] = (counts[m.phrase] || 0) + 1;
            });
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            if (sorted.length > 0) {
              topPhrase = sorted[0][0];
              topCount = sorted[0][1];
            }
          }
        }
      }

      setStats({
        recentSessions: recentRes.count || 0,
        totalSessions: totalSessionsRes.count || 0,
        totalPlayers,
        topPhrase,
        topCount,
      });
    }
    load();

    function handleFocus() { load(); }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [companyId, callIdentifier]);

  if (!stats) {
    return <div className="text-cream/40 text-xs mt-3">Loading stats…</div>;
  }

  const items = [
    { label: "Sessions (24h)", value: stats.recentSessions },
    { label: "Total Games", value: stats.totalSessions },
    { label: "Total Players", value: stats.totalPlayers },
    {
      label: "Most Marked",
      value: stats.topPhrase !== "—" ? `${stats.topPhrase} (${stats.topCount})` : "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-cream/10">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg bg-navy-2/60 border border-cream/5 p-2"
        >
          <div className="text-[8px] uppercase tracking-[0.2em] text-cream/40">
            {item.label}
          </div>
          <div className="mt-0.5 text-sm font-bold text-cream truncate">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function TriviaSection() {
  const [questions, setQuestions] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function load() {
      const { data, count: total } = await supabase
        .from("trivia_questions")
        .select("id, question, difficulty, is_active", { count: "exact" })
        .eq("company_id", "hilton")
        .order("created_at", { ascending: true });

      setQuestions(data || []);
      setCount(total || 0);
    }
    load();
  }, []);

  async function toggleQuestion(id, currentActive) {
    await supabase
      .from("trivia_questions")
      .update({ is_active: !currentActive })
      .eq("id", id);

    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, is_active: !currentActive } : q)),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-cream">Trivia Questions</h3>
        <span className="text-xs text-cream/50">{count} loaded</span>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {questions.map((q) => (
          <div
            key={q.id}
            className="flex items-start gap-3 rounded-lg bg-navy-2/40 border border-cream/5 p-3"
          >
            <button
              onClick={() => toggleQuestion(q.id, q.is_active)}
              className={`mt-0.5 w-8 h-5 rounded-full transition-colors flex items-center ${
                q.is_active ? "bg-green-500 justify-end" : "bg-cream/20 justify-start"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white mx-0.5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-cream leading-snug truncate">
                {q.question}
              </div>
              <div className="text-[10px] text-cream/40 mt-0.5">
                {q.difficulty}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanyCard({ company, onUpdate }) {
  const [earningsDate, setEarningsDate] = useState("");
  const [earningsTime, setEarningsTime] = useState("16:30");
  const [timezone, setTimezone] = useState("America/New_York");
  const [callId, setCallId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCallId(company.call_identifier || "");
    setTimezone(company.next_earnings_timezone || "America/New_York");
    if (company.next_earnings_date) {
      const d = new Date(company.next_earnings_date);
      setEarningsDate(d.toISOString().split("T")[0]);
      setEarningsTime(
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    } else {
      setEarningsDate("");
      setEarningsTime("16:30");
    }
  }, [company]);

  async function toggleActive() {
    const next = !company.is_active;
    await supabase
      .from("companies")
      .update({ is_active: next })
      .eq("id", company.id);
    onUpdate({ ...company, is_active: next });
  }

  async function handleSave() {
    setSaving(true);
    let nextDate = null;
    if (earningsDate) {
      nextDate = new Date(`${earningsDate}T${earningsTime || "16:30"}:00`).toISOString();
    }

    await supabase
      .from("companies")
      .update({
        next_earnings_date: nextDate,
        next_earnings_timezone: timezone,
        call_identifier: callId,
      })
      .eq("id", company.id);

    onUpdate({
      ...company,
      next_earnings_date: nextDate,
      next_earnings_timezone: timezone,
      call_identifier: callId,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const previewDate = earningsDate
    ? new Date(`${earningsDate}T${earningsTime || "16:30"}:00`).toISOString()
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{company.emoji}</span>
          <div>
            <div className="text-lg font-bold text-cream">{company.name}</div>
            <div className="text-xs text-cream/50">
              {company.phrase_count} phrases
            </div>
          </div>
        </div>
        <button
          onClick={toggleActive}
          className={`w-12 h-6 rounded-full transition-colors flex items-center ${
            company.is_active ? "bg-green-500 justify-end" : "bg-cream/20 justify-start"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white mx-0.5" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.3em] text-cream/50 mb-1">
            Earnings Date
          </label>
          <input
            type="date"
            value={earningsDate}
            onChange={(e) => setEarningsDate(e.target.value)}
            className="w-full rounded-lg bg-navy-2/80 border border-cream/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/60 transition"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-cream/50 mb-1">
              Time
            </label>
            <input
              type="time"
              value={earningsTime}
              onChange={(e) => setEarningsTime(e.target.value)}
              className="w-full rounded-lg bg-navy-2/80 border border-cream/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/60 transition"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-cream/50 mb-1">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg bg-navy-2/80 border border-cream/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/60 transition"
            >
              <option value="America/New_York">Eastern</option>
              <option value="America/Chicago">Central</option>
              <option value="America/Denver">Mountain</option>
              <option value="America/Los_Angeles">Pacific</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.3em] text-cream/50 mb-1">
            Call Identifier
          </label>
          <input
            type="text"
            value={callId}
            onChange={(e) => setCallId(e.target.value)}
            placeholder="Q2 2026 Earnings Call"
            className="w-full rounded-lg bg-navy-2/80 border border-cream/10 text-cream px-3 py-2 text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold/60 transition"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-gold text-navy py-2.5 font-semibold active:scale-[0.99] transition disabled:opacity-50 text-sm"
        >
          {saved ? "Saved!" : saving ? "Saving…" : "Save"}
        </button>

        <Countdown targetDate={previewDate} timezone={timezone} />
      </div>

      <CompanyStats companyId={company.id} callIdentifier={company.call_identifier} />
    </div>
  );
}

function AdminPanel({ onSignOut }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("companies").select("*");
      if (data) {
        const sorted = COMPANY_ORDER
          .map((id) => data.find((c) => c.id === id))
          .filter(Boolean);
        setCompanies(sorted);
      }
      setLoading(false);
    }
    load();
  }, []);

  function handleUpdate(updated) {
    setCompanies((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    onSignOut();
  }

  return (
    <div className="bg-radial-navy min-h-full pb-12">
      <header className="pt-8 pb-6 px-6 text-center">
        <h1 className="font-display text-2xl font-black text-cream">
          There It Is<span className="text-gold">.</span>
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-gold/60">
          Admin
        </p>
        <button
          onClick={handleSignOut}
          className="mt-2 text-xs text-cream/40 uppercase tracking-[0.2em] active:text-cream transition"
        >
          Sign Out
        </button>
      </header>

      <main className="px-5 max-w-lg mx-auto space-y-6">
        {loading ? (
          <div className="text-cream/40 text-sm text-center py-10">
            Loading companies...
          </div>
        ) : (
          companies.map((company) => (
            <section
              key={company.id}
              className="rounded-2xl bg-navy-2/80 border border-cream/10 p-5"
            >
              <CompanyCard company={company} onUpdate={handleUpdate} />
            </section>
          ))
        )}

        <section className="rounded-2xl bg-navy-2/80 border border-cream/10 p-5">
          <TriviaSection />
        </section>
      </main>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="bg-radial-navy min-h-full flex items-center justify-center">
        <div className="text-cream/40 text-sm">Loading…</div>
      </div>
    );
  }

  if (!authed) {
    return <GateForm onAuth={() => setAuthed(true)} />;
  }

  return <AdminPanel onSignOut={() => setAuthed(false)} />;
}
