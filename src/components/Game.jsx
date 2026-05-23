import { useEffect, useMemo, useRef, useState } from "react";
import { evaluate, isBlackout, cellsOnLine } from "../lib/bingo";
import { TIER, TRINITY, FILIBUSTER } from "../lib/phrases";
import { supabase } from "../lib/supabase";
import Tile from "./Tile";
import Toolbar from "./Toolbar";
import Toast from "./Toast";
import Celebration from "./Celebration";
import PostGame from "./PostGame";
import LiveFeed from "./LiveFeed";
import Leaderboard from "./Leaderboard";

const STREAK_TIMEOUT_MS = 5 * 60 * 1000;
const TRINITY_WINDOW_MS = 2 * 60 * 1000;
const BINGO_BONUS = 500;
const BLACKOUT_BONUS = 2000;

export default function Game({
  sessionId,
  playerId,
  displayName,
  isCreator,
  initialCard,
  onExit,
  onPlayAgain,
}) {
  const [grid, setGrid] = useState(initialCard);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastMarkAt, setLastMarkAt] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [completedLines, setCompletedLines] = useState([]);
  const [celebration, setCelebration] = useState(null);
  const [didBingo, setDidBingo] = useState(false);
  const [didBlackout, setDidBlackout] = useState(false);
  const [postGame, setPostGame] = useState(false);
  const [feedEntries, setFeedEntries] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerCount, setPlayerCount] = useState(1);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const toastIdRef = useRef(0);
  const trinityTimesRef = useRef({});
  const trinityFiredRef = useRef(false);
  const channelRef = useRef(null);
  const playersRef = useRef([]);
  const lastFeedTimeRef = useRef({});
  const bingoCountRef = useRef(0);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

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
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }

  function tapCell(r, c) {
    const cell = grid[r][c];
    if (cell.isFree || cell.marked) return;

    const now = Date.now();

    const next = grid.map((row, ri) =>
      row.map((cc, ci) =>
        ri === r && ci === c ? { ...cc, marked: true, markedAt: now } : cc,
      ),
    );

    const tileScore = TIER[cell.tier].points;
    let scoreDelta = tileScore;

    const withinStreak =
      lastMarkAt !== 0 && now - lastMarkAt <= STREAK_TIMEOUT_MS;
    const nextStreak = withinStreak ? streak + 1 : 1;

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
        pushToast("TRINITY 🔱 There it is, there it is, there it is.");
      }
    }

    if (cell.phrase === FILIBUSTER) {
      pushToast("He warned you. 🎙️");
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

    supabase
      .from("marks")
      .insert({
        session_id: sessionId,
        player_id: playerId,
        phrase: cell.phrase,
        points_awarded: scoreDelta,
        streak_count: nextStreak,
      })
      .then(({ error }) => {
        if (error) console.error("Failed to write mark:", error);
      });

    const markedSquares = [];
    for (let ri = 0; ri < 5; ri++) {
      for (let ci = 0; ci < 5; ci++) {
        if (next[ri][ci].marked) markedSquares.push([ri, ci]);
      }
    }

    supabase
      .from("players")
      .update({
        score: newScore,
        marked_squares: markedSquares,
        bingo_count: newBingoCount,
        blackout: blackoutHit || didBlackout,
      })
      .eq("id", playerId)
      .then(({ error }) => {
        if (error) console.error("Failed to update player:", error);
      });

    if (blackoutHit) {
      setTimeout(() => {
        setCelebration(null);
        setPostGame(true);
      }, 2400);
    }
  }

  async function endGame() {
    if (isCreator) {
      await supabase
        .from("sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", sessionId);
    }
    setPostGame(true);
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
          onClick={onExit}
          className="text-cream/50 text-xs uppercase tracking-[0.3em] active:text-cream"
        >
          ← Exit
        </button>
        <div className="text-center">
          <div className="font-display font-bold text-cream text-lg leading-none">
            Hilton
          </div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-cream/50 mt-1">
            Q2 2026
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-cream/70 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>
            {playerCount} player{playerCount !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <LiveFeed entries={feedEntries} />

      <main className="px-3 sm:px-5 flex-1 flex items-start justify-center">
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
                />
              )),
            )}
          </div>
        </div>
      </main>

      <Toolbar
        score={score}
        streak={streak}
        onShare={() => setPostGame(true)}
        onEnd={endGame}
        onLeaderboard={() => setShowLeaderboard(true)}
      />
    </div>
  );
}
