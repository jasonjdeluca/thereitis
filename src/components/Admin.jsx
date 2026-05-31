// NOTE: VITE_ADMIN_PASSWORD is no longer used — delete it from Vercel environment variables.
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const COMPANY_ORDER = ["hilton", "ko", "marriott", "hyatt", "ihg", "wyndham", "choice"];

const TICKERS = {
  hilton: "HLT",
  ko: "KO",
  marriott: "MAR",
  hyatt: "H",
  ihg: "IHG",
  wyndham: "WH",
  choice: "CHH",
};

// ─── Readiness table sub-components ──────────────────────────────────────────

function StatusBadge({ isActive, phraseCount, triviaCount }) {
  if (!isActive) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-cream/10 text-cream/40">
        Coming Soon
      </span>
    );
  }
  if (phraseCount >= 50 && triviaCount >= 12) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-green-500/20 text-green-400 border border-green-500/30">
        Ready
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-gold/10 text-gold border border-gold/30">
      Needs Content
    </span>
  );
}

function InlineDateEditor({ companyId, currentDate, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const escapedRef = useRef(false);

  function startEdit() {
    setValue(
      currentDate ? new Date(currentDate).toISOString().split("T")[0] : "",
    );
    setEditing(true);
    setError("");
    escapedRef.current = false;
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    const nextDate = value
      ? new Date(value + "T16:30:00").toISOString()
      : null;
    const { error: supaError } = await supabase
      .from("companies")
      .update({ next_earnings_date: nextDate })
      .eq("id", companyId);
    setSaving(false);
    if (supaError) {
      setError("Save failed");
    } else {
      setEditing(false);
      onSaved(nextDate);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") {
      escapedRef.current = true;
      setEditing(false);
    }
  }

  function handleBlur() {
    if (escapedRef.current) return;
    save();
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <input
          type="date"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={saving}
          className="rounded bg-navy-2/80 border border-gold/40 text-cream px-2 py-1 text-xs focus:outline-none focus:border-gold w-32 disabled:opacity-50"
        />
        {error && (
          <span className="text-red-400 text-[10px]">{error}</span>
        )}
      </div>
    );
  }

  const display = currentDate
    ? new Date(currentDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <button
      onClick={startEdit}
      className="text-left text-sm text-cream/70 hover:text-gold transition underline decoration-dotted underline-offset-2 whitespace-nowrap"
    >
      {display}
    </button>
  );
}

function ActivationToggle({ companyId, isActive, phraseCount, triviaCount, onToggled }) {
  const [loading, setLoading] = useState(false);
  const canActivate = phraseCount >= 50 && triviaCount >= 12;

  async function toggle() {
    setLoading(true);
    const next = !isActive;
    await supabase
      .from("companies")
      .update({ is_active: next })
      .eq("id", companyId);
    setLoading(false);
    onToggled(next);
  }

  if (!isActive && !canActivate) {
    const needPhrases = Math.max(0, 50 - phraseCount);
    const needTrivia = Math.max(0, 12 - triviaCount);
    const parts = [];
    if (needPhrases > 0) parts.push(`${needPhrases} phrases`);
    if (needTrivia > 0) parts.push(`${needTrivia} trivia`);
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          disabled
          className="rounded-lg bg-cream/5 text-cream/25 px-3 py-1.5 text-xs font-semibold cursor-not-allowed border border-cream/10"
          title={`Requires ≥50 phrases and ≥12 trivia questions`}
        >
          Cannot Activate
        </button>
        <span className="text-[9px] text-cream/30 leading-tight">
          Need {parts.join(", ")}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${
        isActive
          ? "bg-red-900/30 border-red-500/30 text-red-400 hover:bg-red-900/50"
          : "bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
      } disabled:opacity-50`}
    >
      {loading ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}

function CompanyReadinessTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [companiesRes, phrasesRes, triviaRes] = await Promise.all([
      supabase
        .from("companies")
        .select("id, name, emoji, is_active, next_earnings_date"),
      supabase.from("phrases").select("company_id"),
      supabase.from("trivia_questions").select("company_id"),
    ]);

    const companies = companiesRes.data || [];
    const phrases = phrasesRes.data || [];
    const trivia = triviaRes.data || [];

    const phraseCounts = {};
    phrases.forEach((p) => {
      phraseCounts[p.company_id] = (phraseCounts[p.company_id] || 0) + 1;
    });

    const triviaCounts = {};
    trivia.forEach((t) => {
      triviaCounts[t.company_id] = (triviaCounts[t.company_id] || 0) + 1;
    });

    const sorted = COMPANY_ORDER.map((id) => companies.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({
        ...c,
        phraseCount: phraseCounts[c.id] || 0,
        triviaCount: triviaCounts[c.id] || 0,
      }));

    setRows(sorted);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleToggled(id, newActive) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: newActive } : r)),
    );
  }

  function handleDateSaved(id, newDate) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, next_earnings_date: newDate } : r,
      ),
    );
  }

  return (
    <section className="rounded-2xl bg-navy-2/80 border border-cream/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-cream/10">
        <h2 className="text-sm font-bold text-cream uppercase tracking-[0.2em]">
          Company Readiness
        </h2>
      </div>

      {loading ? (
        <div className="text-cream/40 text-sm text-center py-6">
          Loading readiness data…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "580px" }}>
            <thead>
              <tr className="border-b border-cream/10">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                  Ticker
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                  Phrases
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                  Trivia
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                  Next Earnings
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-cream/5 last:border-0 hover:bg-cream/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="mr-2 select-none">{row.emoji}</span>
                    <span className="text-cream font-medium">{row.name}</span>
                  </td>
                  <td className="px-4 py-3 text-cream/60 font-mono text-xs">
                    {TICKERS[row.id] || row.id.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.phraseCount >= 50 ? "text-green-400" : "text-gold"
                      }
                    >
                      {row.phraseCount}
                    </span>
                    <span className="text-cream/30 text-xs ml-1">/ 50</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.triviaCount >= 12 ? "text-green-400" : "text-gold"
                      }
                    >
                      {row.triviaCount}
                    </span>
                    <span className="text-cream/30 text-xs ml-1">/ 12</span>
                  </td>
                  <td className="px-4 py-3">
                    <InlineDateEditor
                      companyId={row.id}
                      currentDate={row.next_earnings_date}
                      onSaved={(d) => handleDateSaved(row.id, d)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      isActive={row.is_active}
                      phraseCount={row.phraseCount}
                      triviaCount={row.triviaCount}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ActivationToggle
                      companyId={row.id}
                      isActive={row.is_active}
                      phraseCount={row.phraseCount}
                      triviaCount={row.triviaCount}
                      onToggled={(v) => handleToggled(row.id, v)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Phrase staging review ───────────────────────────────────────────────────

// phrases.tier and phrases.points are NOT NULL with no DB default, so an approve
// must supply them. New phrases land as 'warm'; an admin can re-tier later.
const APPROVE_DEFAULT_TIER = "warm";
const APPROVE_DEFAULT_POINTS = 75;

function BingoTilePreview({ phrase }) {
  return (
    <div className="inline-flex items-center justify-center text-center rounded-lg bg-navy border border-gold text-gold font-semibold uppercase tracking-wide text-[11px] leading-tight px-2 py-2 min-w-[7rem] max-w-[9rem] min-h-[3.5rem]">
      {phrase}
    </div>
  );
}

function PhraseReviewPanel() {
  const [pending, setPending] = useState([]);
  const [companiesMap, setCompaniesMap] = useState({});
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [busyIds, setBusyIds] = useState({});
  const [actionError, setActionError] = useState("");

  async function loadData() {
    const [stagingRes, companiesRes] = await Promise.all([
      supabase
        .from("phrase_staging")
        .select("id, company_id, phrase, source_quarter, nlp_score, nlp_flags, status")
        .order("nlp_score", { ascending: false })
        .limit(20000),
      supabase.from("companies").select("id, name, emoji"),
    ]);

    if (stagingRes.error) {
      // Most likely the table has not been created yet (Task 1 migration).
      setTableMissing(true);
      setLoading(false);
      return;
    }

    const cmap = {};
    (companiesRes.data || []).forEach((c) => {
      cmap[c.id] = c;
    });

    const statusCounts = {};
    (stagingRes.data || []).forEach((r) => {
      if (!statusCounts[r.company_id]) {
        statusCounts[r.company_id] = {
          pending: 0,
          ai_selected: 0,
          ai_rejected: 0,
          approved: 0,
          rejected: 0,
        };
      }
      if (statusCounts[r.company_id][r.status] != null) {
        statusCounts[r.company_id][r.status] += 1;
      }
    });

    setCompaniesMap(cmap);
    setCounts(statusCounts);
    // Show ai_selected rows if any exist; fall back to pending for companies
    // that have not yet been run through ai-select.js.
    const allRows = stagingRes.data || [];
    const hasAiSelected = allRows.some((r) => r.status === "ai_selected");
    setPending(
      allRows.filter((r) =>
        r.status === (hasAiSelected ? "ai_selected" : "pending"),
      ),
    );
    setTableMissing(false);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function bumpCounts(companyId, from, to) {
    setCounts((prev) => {
      const c = prev[companyId] || {
        pending: 0,
        ai_selected: 0,
        ai_rejected: 0,
        approved: 0,
        rejected: 0,
      };
      return {
        ...prev,
        [companyId]: {
          ...c,
          [from]: Math.max(0, (c[from] || 0) - 1),
          [to]: (c[to] || 0) + 1,
        },
      };
    });
  }

  async function approveRow(row) {
    setBusyIds((b) => ({ ...b, [row.id]: true }));
    setActionError("");
    // Refresh the session before writing. getSession() reads from cache and may
    // return an expired token; refreshSession() validates with the server.
    const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr || !refreshData.session) {
      setActionError("Session expired — sign out and sign back in");
      setBusyIds((b) => ({ ...b, [row.id]: false }));
      return false;
    }
    // upsert with ignoreDuplicates: if the phrase already exists in phrases
    // (e.g. inserted by migration.sql), skip the insert and proceed to mark staging approved.
    const ins = await supabase.from("phrases").upsert(
      {
        company_id: row.company_id,
        phrase: row.phrase,
        tier: APPROVE_DEFAULT_TIER,
        points: APPROVE_DEFAULT_POINTS,
      },
      { onConflict: "company_id,phrase", ignoreDuplicates: true }
    );
    if (ins.error) {
      setActionError(`Approve failed: ${ins.error.message}`);
      setBusyIds((b) => ({ ...b, [row.id]: false }));
      return false;
    }
    const upd = await supabase
      .from("phrase_staging")
      .update({ status: "approved" })
      .eq("id", row.id);
    setBusyIds((b) => ({ ...b, [row.id]: false }));
    if (upd.error) {
      setActionError(`Phrase saved but staging update failed: ${upd.error.message}`);
      return false;
    }
    setPending((prev) => prev.filter((r) => r.id !== row.id));
    bumpCounts(row.company_id, row.status, "approved");
    return true;
  }

  async function rejectRow(row) {
    setBusyIds((b) => ({ ...b, [row.id]: true }));
    setActionError("");
    const upd = await supabase
      .from("phrase_staging")
      .update({ status: "rejected" })
      .eq("id", row.id);
    setBusyIds((b) => ({ ...b, [row.id]: false }));
    if (upd.error) {
      setActionError(`Reject failed: ${upd.error.message}`);
      return;
    }
    setPending((prev) => prev.filter((r) => r.id !== row.id));
    bumpCounts(row.company_id, row.status, "rejected");
  }

  async function bulkApprove(companyId) {
    // Approve every pending phrase for this company that has no NLP flags.
    const clean = pending.filter(
      (r) =>
        r.company_id === companyId &&
        (!r.nlp_flags || r.nlp_flags.length === 0),
    );
    for (const row of clean) {
      await approveRow(row);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl bg-navy-2/80 border border-cream/10 p-5">
        <h2 className="text-sm font-bold text-cream uppercase tracking-[0.2em] mb-3">
          Phrase Staging Review
        </h2>
        <div className="text-cream/40 text-sm">Loading staged phrases…</div>
      </section>
    );
  }

  if (tableMissing) {
    return (
      <section className="rounded-2xl bg-navy-2/80 border border-cream/10 border-l-4 border-l-gold p-5">
        <h2 className="text-sm font-bold text-cream uppercase tracking-[0.2em] mb-3">
          Phrase Staging Review
        </h2>
        <p className="text-cream/50 text-sm leading-relaxed">
          Phrase staging table not yet created. Run migration SQL from Task 1
          first.
        </p>
      </section>
    );
  }

  // Companies that currently have reviewable phrases, in a stable order.
  const companyIds = [...new Set(pending.map((r) => r.company_id))].sort(
    (a, b) =>
      (companiesMap[a]?.name || a).localeCompare(companiesMap[b]?.name || b),
  );
  const visibleIds = filter === "all" ? companyIds : companyIds.filter((id) => id === filter);
  const reviewStatus = pending[0]?.status === "ai_selected" ? "ai-selected" : "pending";

  return (
    <section className="rounded-2xl bg-navy-2/80 border border-cream/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-cream/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-cream uppercase tracking-[0.2em]">
            Phrase Staging Review
          </h2>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold/15 text-gold border border-gold/30">
            {pending.length} {reviewStatus}
          </span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg bg-navy-2/80 border border-cream/10 text-cream px-3 py-1.5 text-xs focus:outline-none focus:border-gold/60"
        >
          <option value="all">All Companies</option>
          {companyIds.map((id) => (
            <option key={id} value={id}>
              {(companiesMap[id]?.emoji || "") + " " + (companiesMap[id]?.name || id)}
            </option>
          ))}
        </select>
      </div>

      {actionError && (
        <div className="px-5 py-2 text-red-400 text-xs border-b border-cream/10">
          {actionError}
        </div>
      )}

      {pending.length === 0 ? (
        <div className="text-cream/40 text-sm text-center py-6">
          No phrases to review. Run <code className="text-gold text-[10px]">ai-select.js</code> to stage candidates.
        </div>
      ) : (
        <div className="divide-y divide-cream/10">
          {visibleIds.map((id) => {
            const company = companiesMap[id];
            const c = counts[id] || {
              pending: 0,
              ai_selected: 0,
              ai_rejected: 0,
              approved: 0,
              rejected: 0,
            };
            const groupRows = pending.filter((r) => r.company_id === id);
            return (
              <div key={id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="select-none">{company?.emoji || "🏢"}</span>
                    <span className="text-cream font-medium text-sm">
                      {company?.name || id}
                    </span>
                    <span className="text-[10px] text-cream/40">
                      {c.ai_selected > 0
                        ? `${c.ai_selected} ai-selected`
                        : `${c.pending} pending`}
                      {" · "}{c.approved} approved · {c.rejected} rejected
                    </span>
                  </div>
                  <button
                    onClick={() => bulkApprove(id)}
                    className="rounded-lg bg-gold/10 border border-gold/30 text-gold px-3 py-1.5 text-xs font-semibold hover:bg-gold/20 transition"
                    title="Approve all reviewable phrases for this company that have no flags"
                  >
                    Bulk approve (no flags)
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ minWidth: "640px" }}>
                    <thead>
                      <tr className="border-b border-cream/10">
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                          Phrase
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                          Quarter
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                          Score
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                          Flags
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-[0.2em] text-cream/40 font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupRows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-cream/5 last:border-0"
                        >
                          <td className="px-3 py-3">
                            <BingoTilePreview phrase={row.phrase} />
                          </td>
                          <td className="px-3 py-3 text-cream/60 text-xs whitespace-nowrap">
                            {row.source_quarter || "—"}
                          </td>
                          <td className="px-3 py-3 text-gold text-xs font-mono">
                            {row.nlp_score}
                          </td>
                          <td className="px-3 py-3">
                            {row.nlp_flags && row.nlp_flags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {row.nlp_flags.map((f) => (
                                  <span
                                    key={f}
                                    className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-red-900/30 text-red-300 border border-red-500/30 whitespace-nowrap"
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-cream/25 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => approveRow(row)}
                                disabled={busyIds[row.id]}
                                className="rounded-lg bg-green-900/30 border border-green-500/30 text-green-400 px-3 py-1.5 text-xs font-semibold hover:bg-green-900/50 transition disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectRow(row)}
                                disabled={busyIds[row.id]}
                                className="rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 px-3 py-1.5 text-xs font-semibold hover:bg-red-900/50 transition disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function IngestionStatusPanel() {
  return (
    <section className="rounded-2xl bg-navy-2/80 border border-cream/10 border-l-4 border-l-gold p-5">
      <h2 className="text-sm font-bold text-cream uppercase tracking-[0.2em] mb-3">
        Ingestion Pipeline
      </h2>
      <p className="text-cream/50 text-sm leading-relaxed">
        Pipeline not yet configured. This panel will show ingestion queue
        status once Group F is complete.
      </p>
    </section>
  );
}

// ─── Countdown (admin card preview) ──────────────────────────────────────────

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

// ─── Auth gate ────────────────────────────────────────────────────────────────

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

// ─── Company card (detailed edit view) ───────────────────────────────────────

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

    function handleFocus() {
      load();
    }
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
      value:
        stats.topPhrase !== "—"
          ? `${stats.topPhrase} (${stats.topCount})`
          : "—",
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
          <div className="mt-0.5 text-sm font-bold text-cream truncate">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function TriviaSection({ companyId }) {
  const [questions, setQuestions] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function load() {
      const { data, count: total } = await supabase
        .from("trivia_questions")
        .select("id, question, difficulty, is_active", { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });

      setQuestions(data || []);
      setCount(total || 0);
    }
    load();
  }, [companyId]);

  async function toggleQuestion(id, currentActive) {
    await supabase
      .from("trivia_questions")
      .update({ is_active: !currentActive })
      .eq("id", id);

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, is_active: !currentActive } : q,
      ),
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
                q.is_active
                  ? "bg-green-500 justify-end"
                  : "bg-cream/20 justify-start"
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
      nextDate = new Date(
        `${earningsDate}T${earningsTime || "16:30"}:00`,
      ).toISOString();
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
    ? new Date(
        `${earningsDate}T${earningsTime || "16:30"}:00`,
      ).toISOString()
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
            company.is_active
              ? "bg-green-500 justify-end"
              : "bg-cream/20 justify-start"
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

      <CompanyStats
        companyId={company.id}
        callIdentifier={company.call_identifier}
      />

      <div className="mt-4 pt-4 border-t border-cream/10">
        <TriviaSection companyId={company.id} />
      </div>
    </div>
  );
}

// ─── Admin panel (authenticated view) ────────────────────────────────────────

function AdminPanel({ onSignOut }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("companies").select("*");
      if (data) {
        const sorted = COMPANY_ORDER.map((id) => data.find((c) => c.id === id)).filter(
          Boolean,
        );
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

      <main className="px-5 max-w-3xl mx-auto space-y-6">
        <CompanyReadinessTable />
        <PhraseReviewPanel />
        <IngestionStatusPanel />

        <div className="pt-2">
          <h2 className="text-sm font-bold text-cream uppercase tracking-[0.2em] mb-4">
            Company Details
          </h2>
          <div className="space-y-6">
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
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // getUser() validates the token server-side and auto-refreshes if needed.
    // getSession() only reads from localStorage cache and passes expired tokens.
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, _session) => { if (event === 'SIGNED_OUT') setAuthed(false); }
    );
    return () => subscription.unsubscribe();
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
