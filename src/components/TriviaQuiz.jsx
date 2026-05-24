import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const QUESTION_COUNT = 6;
const DIFFICULTY_MIX = { easy: 2, medium: 3, hard: 1 };
const TIMER_SECONDS = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectQuestions(pool) {
  const byDifficulty = { easy: [], medium: [], hard: [] };
  pool.forEach((q) => {
    if (byDifficulty[q.difficulty]) byDifficulty[q.difficulty].push(q);
  });

  const selected = [];
  for (const [diff, count] of Object.entries(DIFFICULTY_MIX)) {
    const available = shuffle(byDifficulty[diff] || []);
    selected.push(...available.slice(0, count));
  }

  const remaining = shuffle(
    pool.filter((q) => !selected.includes(q)),
  );
  while (selected.length < QUESTION_COUNT && remaining.length > 0) {
    selected.push(remaining.pop());
  }

  return shuffle(selected).slice(0, QUESTION_COUNT);
}

const ANSWER_KEY_MAP = { a: "option_a", b: "option_b", c: "option_c", d: "option_d" };

function correctText(q) {
  const col = ANSWER_KEY_MAP[q.correct_answer?.toLowerCase()];
  return col ? q[col] : q.correct_answer;
}

function resultLine(score) {
  if (score <= 2) return "Not bad.";
  if (score <= 4) return "You were listening.";
  return "Eagle ears.";
}

export default function TriviaQuiz({ onBack }) {
  const [allQuestions, setAllQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    async function fetchQuestions() {
      const { data, error: fetchError } = await supabase
        .from("trivia_questions")
        .select("*")
        .eq("company_id", "hilton")
        .eq("is_active", true);

      if (fetchError || !data || data.length === 0) {
        setError("No trivia questions available yet. Check back soon!");
        setLoading(false);
        return;
      }

      setAllQuestions(data);
      setQuestions(selectQuestions(data));
      setLoading(false);
    }
    fetchQuestions();
  }, []);

  const advanceToNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setTimedOut(false);
    }
  }, [currentIndex, questions.length]);

  useEffect(() => {
    if (loading || done || questions.length === 0) return;
    if (selectedAnswer !== null || timedOut) return;

    startTimeRef.current = Date.now();
    setElapsed(0);

    function tick() {
      const e = (Date.now() - startTimeRef.current) / 1000;
      setElapsed(e);
      if (e >= TIMER_SECONDS) {
        setTimedOut(true);
        setAnswers((prev) => [...prev, null]);
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    }
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentIndex, loading, done, questions.length, selectedAnswer, timedOut]);

  function handleAnswer(option) {
    if (selectedAnswer !== null || timedOut) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setSelectedAnswer(option);
    setAnswers((prev) => [...prev, option]);
  }

  function playAgain() {
    const newSet = selectQuestions(allQuestions);
    setQuestions(newSet);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setTimedOut(false);
    setDone(false);
  }

  if (loading) {
    return (
      <div className="bg-radial-navy min-h-full flex items-center justify-center">
        <div className="text-cream/60 text-sm">Loading trivia...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-radial-navy min-h-full flex flex-col items-center justify-center px-6 gap-6">
        <div className="text-cream/60 text-sm text-center">{error}</div>
        <button
          onClick={onBack}
          className="rounded-2xl border border-cream/20 text-cream px-6 py-3 font-semibold active:scale-[0.99] transition"
        >
          Back to Bingo
        </button>
      </div>
    );
  }

  if (done) {
    const score = answers.reduce((acc, ans, i) => {
      return acc + (ans === correctText(questions[i]) ? 1 : 0);
    }, 0);

    return (
      <div className="bg-radial-navy min-h-full flex flex-col">
        <header className="pt-8 pb-4 px-6 text-center">
          <h1 className="font-display text-2xl font-black text-cream">
            There It Is<span className="text-gold">.</span>
          </h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-cream/50">
            Trivia
          </p>
        </header>

        <main className="flex-1 flex flex-col items-center px-6 pb-32">
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="font-display text-6xl font-black text-gold">
              {score} / {questions.length}
            </div>
            <div className="text-cream text-lg font-semibold">
              {resultLine(score)}
            </div>

            <div className="space-y-3 text-left">
              {questions.map((q, i) => {
                const userAns = answers[i];
                const right = correctText(q);
                const gotIt = userAns === right;
                return (
                  <div
                    key={i}
                    className="rounded-xl bg-navy-2/80 border border-cream/10 px-4 py-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">
                        {userAns === null
                          ? "⏰"
                          : gotIt
                            ? "✅"
                            : "❌"}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm text-cream/80">
                          {q.question}
                        </div>
                        {!gotIt && (
                          <div className="mt-1 text-xs text-gold">
                            {right}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 inset-x-0 z-30 bg-navy-2/95 backdrop-blur border-t border-cream/10 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-sm mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex-1 rounded-2xl border border-cream/20 text-cream py-3 font-semibold active:scale-[0.99] transition"
            >
              Back to Bingo
            </button>
            <button
              onClick={playAgain}
              className="flex-1 rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99] transition"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const options = [q.option_a, q.option_b, q.option_c, q.option_d];
  const labels = ["A", "B", "C", "D"];
  const revealed = selectedAnswer !== null || timedOut;
  const progress = Math.min(elapsed / TIMER_SECONDS, 1);

  return (
    <div className="bg-radial-navy min-h-full flex flex-col">
      <header className="pt-8 pb-4 px-6">
        <div className="flex items-start justify-between">
          <button
            onClick={onBack}
            className="text-cream/40 text-xs uppercase tracking-[0.3em] active:text-cream transition"
          >
            ← Back
          </button>
          <div className="text-center flex-1">
            <h1 className="font-display text-2xl font-black text-cream">
              There It Is<span className="text-gold">.</span>
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-cream/50">
              Trivia
            </p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center text-xs uppercase tracking-[0.3em] text-cream/50">
            Question {currentIndex + 1} of {questions.length}
          </div>

          <div className="h-1 rounded-full bg-cream/10 overflow-hidden">
            {!revealed && (
              <div
                className="h-full bg-gold transition-none"
                style={{ width: `${(1 - progress) * 100}%` }}
              />
            )}
          </div>

          <div className="text-center text-cream font-semibold text-lg leading-snug min-h-[3.5rem]">
            {q.question}
          </div>

          <div className="space-y-3">
            {options.map((option, i) => {
              const isCorrect = option === correctText(q);
              const isSelected = selectedAnswer === option;
              const playerWasRight = selectedAnswer === correctText(q);

              let cardStyle =
                "bg-navy-2/80 border-cream/10 text-cream active:scale-[0.99]";
              if (revealed) {
                if (isCorrect && (playerWasRight || timedOut)) {
                  cardStyle = "bg-green-500/20 border-green-400/60 text-green-200";
                } else if (isCorrect && !playerWasRight) {
                  cardStyle = "bg-gold/20 border-gold/60 text-gold";
                } else if (isSelected && !isCorrect) {
                  cardStyle = "bg-red-500/20 border-red-400/60 text-red-200";
                } else {
                  cardStyle = "bg-navy-2/40 border-cream/5 text-cream/40";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  disabled={revealed}
                  className={`w-full rounded-xl border px-4 py-3 text-left flex items-center gap-3 transition ${cardStyle}`}
                >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                    {labels[i]}
                  </span>
                  <span className="text-sm">{option}</span>
                </button>
              );
            })}
          </div>

          {revealed && q.fun_fact && (
            <div className="rounded-xl bg-gold/10 border border-gold/30 px-4 py-3 text-sm text-cream/80">
              {q.fun_fact}
            </div>
          )}

          {revealed && (
            <button
              onClick={advanceToNext}
              className="w-full rounded-2xl bg-gold text-navy py-3 font-semibold active:scale-[0.99] transition"
            >
              {currentIndex + 1 >= questions.length
                ? "See Results"
                : "Next →"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
