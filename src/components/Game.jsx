import { useEffect, useMemo, useRef, useState } from "react";
import { evaluate, isBlackout, cellsOnLine } from "../lib/bingo";
import { TIER, TRINITY, FILIBUSTER, GREAT_QUESTION, DONT_OVERCOOK, CEO_TIER, CEO_MODE_PHRASES } from "../lib/phrases";
import { supabase } from "../lib/supabase";
import { generateCeoCard } from "../lib/card";
import Tile from "./Tile";
import Toolbar from "./Toolbar";
import Toast from "./Toast";
import Celebration from "./Celebration";
import PostGame from "./PostGame";
import WordOfTheCall from "./WordOfTheCall";
import LiveFeed from "./LiveFeed";
import Leaderboard from "./Leaderboard";
import EndGameLeaderboard from "./EndGameLeaderboard";

const STREAK_TIMEOUT_MS = 5 * 60 * 1000;
const TRINITY_WINDOW_MS = 2 * 60 * 1000;
const BINGO_BONUS = 500;
const BLACKOUT_BONUS = 2000;
const UNDO_WINDOW_MS = 4000;
const SILENCE_TIMEOUT_MS = 5 * 60 * 1000;
const IN_SYNC_WINDOW_MS = 30 * 1000;
const IN_SYNC_THRESHOLD = 5;
const EVERYONE_HEARD_WINDOW_MS = 30 * 1000;

export default function Game({
  sessionId,
  sessionCode,
  playerId,
  displayName,
  initialCard,
  companyId,
  companyName,
  callIdentifier,
  onExit,
  onPlayAgain,
  predictions,
}) {
  const [grid, setGrid] = useState(initialCard);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lastMarkAt, setLastMarkAt] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [completedLines, setCompletedLines] = useState([]);
  const [celebration, setCelebration] = useState(null);
  const [didBingo, setDidBingo] = useState(false);
  const [didBlackout, setDidBlackout] = useState(false);
  const [voting, setVoting] = useState(false);
  const [postGame, setPostGame] = useState(false);
  const [feedEntries, setFeedEntries] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerCount, setPlayerCount] = useState(1);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [endLeaderboard, setEndLeaderboard] = useState(false);
  const [undoPending, setUndoPending] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [ceoMode, setCeoMode] = useState(false);
  const [inSyncFired, setInSyncFired] = useState(false);
  const [ceoTooltip, setCeoTooltip] = useState(null);

  const toastIdRef = useRef(0);
  const trinityTimesRef = useRef({});
  const trinityFiredRef = useRef(false);
  const channelRef = useRef(null);
  const playersRef = useRef([]);
  const lastFeedTimeRef = useRef({});
  const bingoCountRef = useRef(0);
  const undoTimerRef = useRef(null);
  const blackoutTimerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const silenceFiredRef = useRef(false);
  const markTimestampsRef = useRef([]);
  const maxStreakRef = useRef(0);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    resetSilenceTimer();
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (localStorage.getItem("ceo_mode_tooltip_seen")) return;
    const showTimer = setTimeout(() => setCeoTooltip("visible"), 1500);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (ceoTooltip !== "visible") return;
    const autoTimer = setTimeout(() => dismissCeoTooltip(), 6000);
    return () => clearTimeout(autoTimer);
  }, [ceoTooltip]);

  function dismissCeoTooltip() {
    setCeoTooltip("fading");
    localStorage.setItem("ceo_mode_tooltip_seen", "1");
    setTimeout(() => setCeoTooltip(null), 300);
  }

  function resetSilenceTimer() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceFiredRef.current = false;
    silenceTimerRef.current = setTimeout(() => {
      if (!silenceFiredRef.current) {
        silenceFiredRef.current = true;
        broadcastToast("Unusually quiet call 👀");
      }
    }, SILENCE_TIMEOUT_MS);
  }

  useEffect(() => {
    async function fetchPlayers() {
      const { data } = await supabase
        .from("players")
        .select("id, display_name, score, bingo_count, blackout")
        .eq("session_id", sessionId);
      if (data) {
        setPlayers(data);
        setPlayerCount(data.length);
      }
    }
    fetchPlayers();

    const channel = supabase.channel(`game:${sessionId}`);

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const count = Object.values(state).flat().length;
      if (count > 0) setPlayerCount(count);
    });

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "marks",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const mark = payload.new;

        resetSilenceTimer();

        checkEveryoneHeardThat(mark.phrase, mark.created_at || new Date().toISOString());
        checkInSync(mark.phrase, mark.player_id, mark.created_at || new Date().toISOString());

        if (mark.player_id === playerId) return;

        const now = Date.now();
        const lastTime = lastFeedTimeRef.current[mark.player_id] || 0;
        if (now - lastTime < 8000) return;
        lastFeedTimeRef.current[mark.player_id] = now;

        const player = playersRef.current.find(
          (p) => p.id === mark.player_id,
        );
        const name = player?.display_name || "Someone";

        setFeedEntries((prev) =>
          [
            {
              id: mark.id,
              playerName: name,
              phrase: mark.phrase,
              type: "mark",
              timestamp: now,
            },
            ...prev,
          ].slice(0, 8),
        );
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "players",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const updated = payload.new;
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === updated.id
              ? {
                  ...p,
                  score: updated.score,
                  bingo_count: updated.bingo_count,
                  blackout: updated.blackout,
                }
              : p,
          ),
        );

        if (updated.id !== playerId) {
          const old = playersRef.current.find((p) => p.id === updated.id);
          if (old && updated.bingo_count > (old.bingo_count || 0)) {
            const name = old.display_name || "Someone";
            setFeedEntries((prev) =>
              [
                {
                  id: `bingo-${updated.id}-${updated.bingo_count}`,
                  playerName: name,
                  phrase: "",
                  type: "bingo",
                  timestamp: Date.now(),
                },
                ...prev,
              ].slice(0, 8),
            );
          }
        }
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "players",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const newPlayer = payload.new;
        setPlayers((prev) => {
          if (prev.find((p) => p.id === newPlayer.id)) return prev;
          return [
            ...prev,
            {
              id: newPlayer.id,
              display_name: newPlayer.display_name,
              score: newPlayer.score || 0,
              bingo_count: newPlayer.bingo_count || 0,
              blackout: newPlayer.blackout || false,
            },
          ];
        });
      },
    );

    channel.on("broadcast", { event: "toast" }, (payload) => {
      pushToast(payload.payload.text);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          display_name: displayName,
          player_id: playerId,
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, playerId, displayName]);

  useEffect(() => {
    if (streak === 0 || lastMarkAt === 0) return;
    const elapsed = Date.now() - lastMarkAt;
    const remaining = Math.max(0, STREAK_TIMEOUT_MS - elapsed);
    const id = setTimeout(() => setStreak(0), remaining + 50);
    return () => clearTimeout(id);
  }, [streak, lastMarkAt]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (blackoutTimerRef.current) clearTimeout(blackoutTimerRef.current);
    };
  }, []);

  const onLineCells = useMemo(() => {
    const set = new Set();
    for (const key of completedLines) {
      for (const [r, c] of cellsOnLine(key)) set.add(`${r}-${c}`);
    }
    return set;
  }, [completedLines]);

  const { nearMiss } = useMemo(() => evaluate(grid), [grid]);

  function pushToast(text) {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3200,
    );
  }

  function broadcastToast(text) {
    pushToast(text);
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "toast",
        payload: { text },
      });
    }
  }

  function checkEveryoneHeardThat(phrase, timestamp) {
    const now = Date.now();
    markTimestampsRef.current.push({ phrase, time: now });
    markTimestampsRef.current = markTimestampsRef.current.filter(
      (m) => now - m.time <= EVERYONE_HEARD_WINDOW_MS,
    );

    const activeCount = playersRef.current.length;
    if (activeCount < 2) return;

    const threshold = Math.ceil(activeCount * 0.75);
    const recentForPhrase = markTimestampsRef.current.filter(
      (m) => m.phrase === phrase,
    );

    const uniquePlayers = new Set();
    recentForPhrase.forEach(() => uniquePlayers.add(phrase));

    if (recentForPhrase.length >= threshold) {
      broadcastToast("Everyone heard that one 👀");
      markTimestampsRef.current = markTimestampsRef.current.filter(
        (m) => m.phrase !== phrase,
      );
    }
  }

  function checkInSync(phrase, markPlayerId, timestamp) {
    if (inSyncFired) return;
    const now = Date.now();
    const myMarked = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cell = grid[r][c];
        if (cell.marked && cell.markedAt && now - cell.markedAt <= IN_SYNC_WINDOW_MS) {
          myMarked.push(cell.phrase);
        }
      }
    }

    if (myMarked.includes(phrase)) {
      const recentMarks = markTimestampsRef.current.filter(
        (m) => m.phrase === phrase && now - m.time <= IN_SYNC_WINDOW_MS,
      );
      if (recentMarks.length >= IN_SYNC_THRESHOLD) {
        setInSyncFired(true);
      }
    }
  }

  function getPointsForTier(tier) {
    if (ceoMode) return CEO_TIER[tier]?.points || 0;
    return TIER[tier]?.points || 0;
  }

  function commitPending(pending) {
    supabase
      .from("marks")
      .insert({
        session_id: sessionId,
        player_id: playerId,
        phrase: pending.phrase,
        points_awarded: pending.scoreDelta,
        streak_count: pending.nextStreak,
      })
      .then(({ error }) => {
        if (error) console.error("Failed to write mark:", error);
      });

    supabase
      .from("players")
      .update({
        score: pending.newScore,
        marked_squares: pending.markedSquares,
        bingo_count: pending.newBingoCount,
        blackout: pending.isBlackout,
      })
      .eq("id", playerId)
      .then(({ error }) => {
        if (error) console.error("Failed to update player:", error);
      });
  }

  function handleUndo() {
    if (!undoPending) return;
    const { snapshot } = undoPending;

    setGrid(snapshot.grid);
    setScore(snapshot.score);
    setStreak(snapshot.streak);
    setLastMarkAt(snapshot.lastMarkAt);
    setCompletedLines(snapshot.completedLines);
    setDidBingo(snapshot.didBingo);
    setDidBlackout(snapshot.didBlackout);
    bingoCountRef.current = snapshot.bingoCount;
    trinityTimesRef.current = snapshot.trinityTimes;
    trinityFiredRef.current = snapshot.trinityFired;
    setPlayers(snapshot.players);
    setCelebration(null);

    if (blackoutTimerRef.current) {
      clearTimeout(blackoutTimerRef.current);
      blackoutTimerRef.current = null;
    }

    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    setUndoPending(null);
  }

  function flushPending() {
    if (undoPending) {
      commitPending(undoPending);
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
      setUndoPending(null);
    }
  }

  function tapCell(r, c) {
    const cell = grid[r][c];
    if (cell.isFree || cell.marked) return;

    if (undoPending) {
      commitPending(undoPending);
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    const snapshot = {
      grid,
      score,
      streak,
      lastMarkAt,
      completedLines,
      didBingo,
      didBlackout,
      bingoCount: bingoCountRef.current,
      trinityTimes: { ...trinityTimesRef.current },
      trinityFired: trinityFiredRef.current,
      players: [...players],
    };

    const now = Date.now();

    const next = grid.map((row, ri) =>
      row.map((cc, ci) =>
        ri === r && ci === c ? { ...cc, marked: true, markedAt: now } : cc,
      ),
    );

    resetSilenceTimer();

    let tileScore = getPointsForTier(cell.tier);

    if (cell.phrase === GREAT_QUESTION) {
      tileScore *= 2;
      pushToast("Double points! 🎯");
    }

    let scoreDelta = tileScore;

    if (cell.phrase === DONT_OVERCOOK) {
      broadcastToast("Don't overcook it. 🍳");
    }

    if (cell.phrase === FILIBUSTER) {
      pushToast("He warned you. 🎙️");
    }

    const withinStreak =
      lastMarkAt !== 0 && now - lastMarkAt <= STREAK_TIMEOUT_MS;
    const nextStreak = withinStreak ? streak + 1 : 1;

    if (nextStreak > maxStreakRef.current) {
      maxStreakRef.current = nextStreak;
      setMaxStreak(nextStreak);
    }

    if (TRINITY.includes(cell.phrase)) {
      trinityTimesRef.current[cell.phrase] = now;
      const times = TRINITY.map((p) => trinityTimesRef.current[p]).filter(
        Boolean,
      );
      if (
        !trinityFiredRef.current &&
        times.length === 3 &&
        Math.max(...times) - Math.min(...times) <= TRINITY_WINDOW_MS
      ) {
        trinityFiredRef.current = true;
        broadcastToast("TRINITY 🔱 There it is, there it is, there it is.");
        scoreDelta += 750;
      }
    }

    let predictionHit = false;
    if (predictions && predictions.includes(cell.phrase)) {
      predictionHit = true;
      scoreDelta += 200;
    }

    const { completed } = evaluate(next);
    const newLines = completed.filter((k) => !completedLines.includes(k));
    let newBingoCount = bingoCountRef.current;
    if (newLines.length > 0) {
      scoreDelta += BINGO_BONUS * newLines.length;
      newBingoCount += newLines.length;
      bingoCountRef.current = newBingoCount;
      if (!didBingo) setDidBingo(true);
      setCompletedLines(completed);
      setCelebration("bingo");
    }

    let blackoutHit = false;
    if (isBlackout(next) && !didBlackout) {
      blackoutHit = true;
      scoreDelta += BLACKOUT_BONUS;
      setDidBlackout(true);
      setCelebration("blackout");
    }

    if (predictions && predictions.length === 3) {
      const allMarkedPhrases = [];
      for (let ri = 0; ri < 5; ri++) {
        for (let ci = 0; ci < 5; ci++) {
          if (next[ri][ci].marked && !next[ri][ci].isFree)
            allMarkedPhrases.push(next[ri][ci].phrase);
        }
      }
      const correctCount = predictions.filter((p) =>
        allMarkedPhrases.includes(p),
      ).length;
      if (correctCount === 3) {
        const alreadyHadAll =
          predictions.filter((p) => {
            for (let ri = 0; ri < 5; ri++)
              for (let ci = 0; ci < 5; ci++)
                if (grid[ri][ci].marked && grid[ri][ci].phrase === p) return true;
            return false;
          }).length === 3;
        if (!alreadyHadAll) {
          scoreDelta += 1000;
          pushToast("PSYCHIC 🔮 All 3 predictions correct!");
        }
      }
    }

    const newScore = score + scoreDelta;

    setGrid(next);
    setScore(newScore);
    setStreak(nextStreak);
    setLastMarkAt(now);

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? {
              ...p,
              score: newScore,
              bingo_count: newBingoCount,
              blackout: blackoutHit || p.blackout,
            }
          : p,
      ),
    );

    const markedSquares = [];
    for (let ri = 0; ri < 5; ri++) {
      for (let ci = 0; ci < 5; ci++) {
        if (next[ri][ci].marked) markedSquares.push([ri, ci]);
      }
    }

    const pending = {
      snapshot,
      phrase: cell.phrase,
      scoreDelta,
      nextStreak,
      newScore,
      newBingoCount,
      isBlackout: blackoutHit || didBlackout,
      markedSquares,
      timestamp: now,
    };

    setUndoPending(pending);

    undoTimerRef.current = setTimeout(() => {
      commitPending(pending);
      setUndoPending((cur) =>
        cur && cur.timestamp === pending.timestamp
          ? { ...cur, fading: true }
          : cur,
      );
      setTimeout(
        () =>
          setUndoPending((cur) =>
            cur && cur.timestamp === pending.timestamp ? null : cur,
          ),
        300,
      );
      undoTimerRef.current = null;
    }, UNDO_WINDOW_MS);

    if (blackoutHit) {
      blackoutTimerRef.current = setTimeout(() => {
        setCelebration(null);
        commitPending(pending);
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current);
          undoTimerRef.current = null;
        }
        setUndoPending(null);
        const mp = playersRef.current.length >= 2;
        if (mp) {
          setEndLeaderboard(true);
        } else {
          setPostGame(true);
        }
        blackoutTimerRef.current = null;
      }, 2400);
    }
  }

  function toggleCeoMode() {
    const next = !ceoMode;
    setCeoMode(next);
    if (next) {
      setGrid(generateCeoCard());
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      maxStreakRef.current = 0;
      setCompletedLines([]);
      setDidBingo(false);
      setDidBlackout(false);
      bingoCountRef.current = 0;
      trinityTimesRef.current = {};
      trinityFiredRef.current = false;
      pushToast("CEO Mode activated 🎙️");
    } else {
      setGrid(initialCard);
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      maxStreakRef.current = 0;
      setCompletedLines([]);
      setDidBingo(false);
      setDidBlackout(false);
      bingoCountRef.current = 0;
      trinityTimesRef.current = {};
      trinityFiredRef.current = false;
      pushToast("Standard mode");
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(sessionCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1500);
    } catch {
      // clipboard not available
    }
  }

  function handleExit() {
    flushPending();
    onExit();
  }

  function handleShare() {
    flushPending();
    const isMultiplayer = players.length >= 2;
    if (isMultiplayer) {
      setEndLeaderboard(true);
    } else {
      setPostGame(true);
    }
  }

  function endGame() {
    flushPending();
    const isMultiplayer = players.length >= 2;
    if (isMultiplayer) {
      setEndLeaderboard(true);
    } else {
      setPostGame(true);
    }
  }

  if (endLeaderboard) {
    return (
      <EndGameLeaderboard
        players={players}
        currentPlayerId={playerId}
        onContinue={() => {
          setEndLeaderboard(false);
          setVoting(true);
        }}
      />
    );
  }

  if (voting) {
    return (
      <WordOfTheCall
        sessionId={sessionId}
        playerId={playerId}
        playerCount={playerCount}
        onComplete={() => {
          setVoting(false);
          setPostGame(true);
        }}
      />
    );
  }

  if (postGame) {
    return (
      <PostGame
        grid={grid}
        score={score}
        didBingo={didBingo}
        didBlackout={didBlackout}
        onPlayAgain={onPlayAgain}
        players={players}
        currentPlayerId={playerId}
        maxStreak={maxStreak}
        predictions={predictions}
        trinityFired={trinityFiredRef.current}
        inSyncFired={inSyncFired}
        ceoMode={ceoMode}
        sessionId={sessionId}
        companyId={companyId}
        callIdentifier={callIdentifier}
      />
    );
  }

  const boardPulse =
    nearMiss && completedLines.length === 0 ? "animate-nearmiss" : "";

  return (
    <div className="bg-radial-navy min-h-full flex flex-col pb-24">
      <Toast toasts={toasts} />
      <Celebration kind={celebration} onClose={() => setCelebration(null)} />
      {showLeaderboard && (
        <Leaderboard
          players={players}
          currentPlayerId={playerId}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      <header className="pt-5 pb-3 px-5 flex items-center justify-between">
        <button
          onClick={handleExit}
          className="text-cream/50 text-xs uppercase tracking-[0.3em] active:text-cream"
        >
          ← Exit
        </button>
        <div className="text-center">
          <div className="font-display font-bold text-cream text-lg leading-none">
            {companyName || "There It Is"}
          </div>
          {callIdentifier && (
            <div className="text-[9px] uppercase tracking-[0.3em] text-cream/50 mt-1">
              {callIdentifier}
            </div>
          )}
          <div className={`text-[9px] mt-0.5 ${ceoMode ? "text-gold" : "text-cream/40"}`}>
            {ceoMode ? "CEO Mode 👔" : "Standard"}
          </div>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className="text-xs text-cream/50">
              Code: {sessionCode}
            </span>
            <button
              onClick={copyCode}
              className="text-cream/50 active:text-gold text-xs transition"
              aria-label="Copy session code"
            >
              {codeCopied ? (
                <span className="text-gold text-[10px]">Copied!</span>
              ) : (
                <span aria-hidden>📋</span>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-cream/70 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>
            {playerCount} player{playerCount !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="flex justify-center mb-2 relative">
        <button
          onClick={toggleCeoMode}
          className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full border transition ${
            ceoMode
              ? "bg-gold/20 border-gold/60 text-gold font-semibold"
              : "border-cream/20 text-cream/60 active:border-gold/40"
          }`}
        >
          {ceoMode ? "CEO Mode ✓" : "CEO Mode"}
        </button>
      </div>

      {ceoTooltip && (
        <div className={`flex justify-center px-5 mb-2 ${
          ceoTooltip === "fading" ? "animate-tooltipOut" : "animate-tooltipIn"
        }`}>
          <div className="w-full max-w-md rounded-xl bg-navy-2/95 border border-gold/50 shadow-gold px-4 py-3">
            <div className="flex flex-col items-center text-center gap-2">
              <span className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-gold/50 -mt-5" />
              <p className="text-xs text-cream/80 leading-relaxed">
                CEO Mode reshuffles your card with phrases most likely heard
                from the top of the call. Optional — tap anytime to try it.
              </p>
              <button
                onClick={dismissCeoTooltip}
                className="text-gold text-xs font-semibold active:scale-95 transition"
              >
                Got it →
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="px-3 sm:px-5 flex-1 flex flex-col items-center">
        <div
          className={`w-full max-w-md rounded-2xl bg-navy-2/40 p-2 border border-cream/5 ${boardPulse}`}
        >
          <div className="grid grid-cols-5 gap-1.5">
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <Tile
                  key={`${r}-${c}`}
                  cell={cell}
                  onTap={() => tapCell(r, c)}
                  onLine={onLineCells.has(`${r}-${c}`)}
                  isPrediction={predictions && predictions.includes(cell.phrase) && !cell.marked}
                  predictionHit={predictions && predictions.includes(cell.phrase) && cell.marked}
                  isGreatQuestion={cell.phrase === GREAT_QUESTION && cell.marked}
                />
              )),
            )}
          </div>
        </div>

        <div className="w-full max-w-md">
          <LiveFeed entries={feedEntries} />
        </div>
      </main>

      {undoPending && (
        <div className="fixed bottom-[68px] inset-x-0 z-[35] flex justify-center px-4 pointer-events-none">
          <div
            key={undoPending.timestamp}
            className={`pointer-events-auto w-full max-w-[280px] rounded-xl bg-navy-2/95 border border-gold/40 shadow-gold overflow-hidden ${
              undoPending.fading ? "animate-undoOut" : "animate-undoIn"
            }`}
          >
            <div className="px-4 py-2.5 flex items-center justify-between gap-2">
              <span className="text-sm text-cream truncate">
                {undoPending.phrase} marked &middot;
              </span>
              <button
                onClick={handleUndo}
                className="text-gold font-bold text-sm shrink-0 active:scale-95"
              >
                Undo
              </button>
            </div>
            <div className="h-0.5 bg-gold/20">
              <div
                className="h-full bg-gold origin-left"
                style={{
                  animation: `undoProgress ${UNDO_WINDOW_MS}ms linear forwards`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      <Toolbar
        score={score}
        streak={streak}
        onShare={handleShare}
        onEnd={endGame}
        onLeaderboard={() => setShowLeaderboard(true)}
      />
    </div>
  );
}
