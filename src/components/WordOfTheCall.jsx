import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const VOTE_TIMER_SECONDS = 15;
const SAFETY_NET_SECONDS = 20;

export default function WordOfTheCall({
  sessionId,
  playerId,
  playerCount,
  onComplete,
}) {
  const [topPhrases, setTopPhrases] = useState([]);
  const [votes, setVotes] = useState({});
  const [myVote, setMyVote] = useState(null);
  const [winner, setWinner] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(VOTE_TIMER_SECONDS);
  const [timerDone, setTimerDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSafetyNet, setShowSafetyNet] = useState(false);
  const [notEnoughVotes, setNotEnoughVotes] = useState(false);
  const startRef = useRef(Date.now());
  const animRef = useRef(null);
  const channelRef = useRef(null);
  const topPhrasesRef = useRef([]);
  const resolvedRef = useRef(false);

  useEffect(() => {
    topPhrasesRef.current = topPhrases;
  }, [topPhrases]);

  useEffect(() => {
    async function fetchTopPhrases() {
      const { data } = await supabase
        .from("marks")
        .select("phrase")
        .eq("session_id", sessionId);

      if (!data || data.length === 0) {
        onComplete();
        return;
      }

      const counts = {};
      data.forEach((m) => {
        counts[m.phrase] = (counts[m.phrase] || 0) + 1;
      });

      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([phrase]) => phrase);

      if (sorted.length === 0) {
        onComplete();
        return;
      }

      setTopPhrases(sorted);
    }

    async function fetchExistingVotes() {
      const { data } = await supabase
        .from("call_votes")
        .select("player_id, phrase")
        .eq("session_id", sessionId);

      if (data) {
        const v = {};
        data.forEach((row) => {
          v[row.phrase] = (v[row.phrase] || 0) + 1;
          if (row.player_id === playerId) setMyVote(row.phrase);
        });
        setVotes(v);
      }
    }

    fetchTopPhrases();
    fetchExistingVotes();
  }, [sessionId, playerId, onComplete]);

  useEffect(() => {
    const channel = supabase.channel(`votes:${sessionId}`);

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "call_votes",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const vote = payload.new;
        setVotes((prev) => ({
          ...prev,
          [vote.phrase]: (prev[vote.phrase] || 0) + 1,
        }));
      },
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => channel.unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    function tick() {
      const e = (Date.now() - startRef.current) / 1000;
      const remaining = Math.max(0, Math.ceil(VOTE_TIMER_SECONDS - e));
      setSecondsLeft(remaining);

      if (e >= SAFETY_NET_SECONDS) {
        setShowSafetyNet(true);
      }

      if (e >= VOTE_TIMER_SECONDS) {
        setTimerDone(true);
        resolveWinner();
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  function resolveWinner() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    if (animRef.current) cancelAnimationFrame(animRef.current);

    setVotes((current) => {
      const totalVoteCount = Object.values(current).reduce((s, v) => s + v, 0);
      if (totalVoteCount < 2) {
        setNotEnoughVotes(true);
        setTimeout(() => onComplete(), 2500);
        return current;
      }

      const phrases = topPhrasesRef.current;
      const entries = Object.entries(current);
      let w;
      if (entries.length === 0) {
        w = phrases[0];
      } else {
        const sorted = entries.sort((a, b) => b[1] - a[1]);
        w = sorted[0]?.[0] || phrases[0];
      }
      if (w) {
        setWinner(w);
        writeWinner(w);
      }
      return current;
    });
  }

  async function writeWinner(phrase) {
    if (!phrase) return;
    const { data } = await supabase
      .from("sessions")
      .select("winner_phrase")
      .eq("id", sessionId)
      .single();

    if (data?.winner_phrase) return;

    await supabase
      .from("sessions")
      .update({ winner_phrase: phrase })
      .eq("id", sessionId);
  }

  async function castVote(phrase) {
    if (myVote) return;
    setMyVote(phrase);

    const { error } = await supabase.from("call_votes").insert({
      session_id: sessionId,
      player_id: playerId,
      phrase,
    });

    if (error) {
      setMyVote(null);
      return;
    }

    if (timerDone) {
      resolveWinner();
    }
  }

  async function handleShare() {
    const text = `The phrase of the call: "${winner}" 👑 — thereitis.live`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  const progress = Math.min(
    (Date.now() - startRef.current) / 1000 / VOTE_TIMER_SECONDS,
    1,
  );
  const totalVotes = Object.values(votes).reduce((s, v) => s + v, 0);

  if (notEnoughVotes) {
    return (
      <div className="bg-radial-navy min-h-full flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-3xl">🗳️</div>
          <p className="text-cream/60 text-sm">
            Not enough votes this session
          </p>
        </div>
      </div>
    );
  }

  if (winner) {
    return (
      <div className="bg-radial-navy min-h-full flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-cream/50">
            Word of the Call
          </div>
          <div className="text-5xl">👑</div>
          <div className="font-display text-2xl font-black text-gold">
            {winner}
          </div>
          <p className="text-cream/60 text-sm">
            The phrase of the call.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 rounded-2xl border border-gold/60 text-cream py-3 font-semibold active:scale-[0.99] transition"
            >
              {copied ? "Copied!" : "Share"}
            </button>
            <button
              onClick={onComplete}
              className="flex-1 rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99] transition"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-radial-navy min-h-full flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h2 className="font-display text-xl font-black text-gold">
            Word of the Call
          </h2>
          <p className="mt-2 text-sm text-cream/60">
            Tap the phrase you heard the most today. One vote. Make it count.
          </p>
        </div>

        <div>
          <div className="h-1 rounded-full bg-cream/10 overflow-hidden">
            <div
              className="h-full bg-gold transition-none"
              style={{ width: `${(1 - progress) * 100}%` }}
            />
          </div>
          <div className="mt-1.5 text-center text-xs text-cream/40">
            {timerDone ? "Time's up" : `⏱ ${secondsLeft} second${secondsLeft !== 1 ? "s" : ""} to vote`}
          </div>
        </div>

        <div className="space-y-2">
          {topPhrases.map((phrase) => {
            const count = votes[phrase] || 0;
            const isMyVote = myVote === phrase;
            const pct =
              totalVotes > 0
                ? Math.round((count / totalVotes) * 100)
                : 0;

            return (
              <button
                key={phrase}
                onClick={() => castVote(phrase)}
                disabled={!!myVote}
                className={`w-full rounded-xl border px-4 py-3 text-left transition active:scale-[0.99] ${
                  isMyVote
                    ? "bg-gold/20 border-gold/60 text-gold"
                    : myVote
                      ? "bg-navy-2/40 border-cream/10 text-cream/60"
                      : "bg-navy-2/80 border-cream/10 text-cream hover:border-gold/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{phrase}</span>
                  {totalVotes > 0 && count > 0 && (
                    <span className="text-xs text-cream/40">
                      {count} vote{count !== 1 ? "s" : ""} · {pct}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showSafetyNet && (
          <div className="text-center">
            <button
              onClick={onComplete}
              className="text-cream/40 text-xs active:text-cream transition"
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
