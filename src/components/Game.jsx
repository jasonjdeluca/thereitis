import { useEffect, useMemo, useRef, useState } from "react";
import { generateCard } from "../lib/card";
import { evaluate, isBlackout, cellsOnLine } from "../lib/bingo";
import { TIER, TRINITY, FILIBUSTER } from "../lib/phrases";
import Tile from "./Tile";
import Toolbar from "./Toolbar";
import Toast from "./Toast";
import Celebration from "./Celebration";
import PostGame from "./PostGame";

const STREAK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const TRINITY_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const FIRST_MARK_BONUS = 100;
const BINGO_BONUS = 500;
const BLACKOUT_BONUS = 2000;

export default function Game({ onExit }) {
  const [grid, setGrid] = useState(() => generateCard());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastMarkAt, setLastMarkAt] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [completedLines, setCompletedLines] = useState([]); // line keys
  const [celebration, setCelebration] = useState(null); // 'bingo' | 'blackout' | null
  const [didBingo, setDidBingo] = useState(false);
  const [didBlackout, setDidBlackout] = useState(false);
  const [postGame, setPostGame] = useState(false);
  const toastIdRef = useRef(0);
  const trinityTimesRef = useRef({}); // phrase -> timestamp
  const trinityFiredRef = useRef(false);

  // Streak reset timer
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
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }

  function totalMarked(g) {
    let n = 0;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) if (g[r][c].marked || g[r][c].isFree) n++;
    return n;
  }

  function tapCell(r, c) {
    const cell = grid[r][c];
    if (cell.isFree || cell.marked) return;

    const now = Date.now();

    // Mark cell
    const next = grid.map((row, ri) =>
      row.map((cc, ci) =>
        ri === r && ci === c ? { ...cc, marked: true, markedAt: now } : cc,
      ),
    );

    // Score for this tile
    const tileScore = TIER[cell.tier].points;
    let scoreDelta = tileScore;

    // First mark bonus (no marked tiles yet other than FREE)
    const wasFirst = totalMarked(grid) === 1; // only FREE was counted
    if (wasFirst) scoreDelta += FIRST_MARK_BONUS;

    // Streak: consecutive marks within 5 min
    const withinStreak = lastMarkAt !== 0 && now - lastMarkAt <= STREAK_TIMEOUT_MS;
    const nextStreak = withinStreak ? streak + 1 : 1;

    // Trinity tracking
    if (TRINITY.includes(cell.phrase)) {
      trinityTimesRef.current[cell.phrase] = now;
      const times = TRINITY.map((p) => trinityTimesRef.current[p]).filter(Boolean);
      if (
        !trinityFiredRef.current &&
        times.length === 3 &&
        Math.max(...times) - Math.min(...times) <= TRINITY_WINDOW_MS
      ) {
        trinityFiredRef.current = true;
        pushToast("TRINITY 🔱 There it is, there it is, there it is.");
      }
    }

    // Filibuster toast
    if (cell.phrase === FILIBUSTER) {
      pushToast("He warned you. 🎙️");
    }

    // Detect new bingos
    const { completed } = evaluate(next);
    const newLines = completed.filter((k) => !completedLines.includes(k));
    if (newLines.length > 0) {
      scoreDelta += BINGO_BONUS * newLines.length;
      if (!didBingo) setDidBingo(true);
      setCompletedLines(completed);
      setCelebration("bingo");
    }

    // Blackout
    let blackoutHit = false;
    if (isBlackout(next) && !didBlackout) {
      blackoutHit = true;
      scoreDelta += BLACKOUT_BONUS;
      setDidBlackout(true);
      setCelebration("blackout");
    }

    setGrid(next);
    setScore((s) => s + scoreDelta);
    setStreak(nextStreak);
    setLastMarkAt(now);

    if (blackoutHit) {
      setTimeout(() => {
        setCelebration(null);
        setPostGame(true);
      }, 2400);
    }
  }

  function endGame() {
    setPostGame(true);
  }

  function playAgain() {
    setGrid(generateCard());
    setScore(0);
    setStreak(0);
    setLastMarkAt(0);
    setCompletedLines([]);
    setCelebration(null);
    setDidBingo(false);
    setDidBlackout(false);
    setPostGame(false);
    setToasts([]);
    trinityTimesRef.current = {};
    trinityFiredRef.current = false;
  }

  async function share() {
    // Toolbar share — jump to post-game where the share card lives
    setPostGame(true);
  }

  if (postGame) {
    return (
      <PostGame
        grid={grid}
        score={score}
        didBingo={didBingo}
        didBlackout={didBlackout}
        onPlayAgain={playAgain}
      />
    );
  }

  const boardPulse = nearMiss && completedLines.length === 0 ? "animate-nearmiss" : "";

  return (
    <div className="bg-radial-navy min-h-full flex flex-col pb-24">
      <Toast toasts={toasts} />
      <Celebration kind={celebration} onClose={() => setCelebration(null)} />

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
        <div className="w-14" />
      </header>

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

      <Toolbar score={score} streak={streak} onShare={share} onEnd={endGame} />
    </div>
  );
}
