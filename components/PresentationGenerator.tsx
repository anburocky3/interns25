"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { InternProfile } from "@/types";

type Props = { interns: InternProfile[] };

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type gender = "all" | "M" | "F";

export default function PresentationGenerator({ interns }: Props) {
  console.log(interns);

  const [gender, setGender] = useState<gender>("all");
  const [onlyStudents, setOnlyStudents] = useState(false);
  const [onlyWifi, setOnlyWifi] = useState(false);

  const [queue, setQueue] = useState<InternProfile[]>([]);
  const [presentedIds, setPresentedIds] = useState<string[]>([]);

  const [runningTimerSeconds, setRunningTimerSeconds] = useState<number>(30);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const warningPlayedRef = useRef(false);
  const lowTimeIntervalRef = useRef<number | null>(null);

  function playTone(
    freq: number,
    duration = 200,
    type: OscillatorType = "sine"
  ) {
    try {
      const win = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioCtxCtor = win.AudioContext || win.webkitAudioContext;
      if (!AudioCtxCtor) return;
      const ctx = new AudioCtxCtor();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      setTimeout(() => {
        g.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + duration / 1000
        );
        o.stop(ctx.currentTime + duration / 1000 + 0.02);
        try {
          ctx.close();
        } catch {}
      }, duration);
    } catch {
      // ignore audio failures
    }
  }

  function playWarningTone() {
    // short ascending beep sequence
    playTone(880, 120, "sine");
    setTimeout(() => playTone(1320, 120, "sine"), 150);
  }

  function playStopTone() {
    // two descending beeps
    playTone(440, 220, "sine");
    setTimeout(() => playTone(220, 360, "sine"), 250);
  }

  // load presented ids from localStorage (client only)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem("presentation_presented_ids");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // ensure items are numbers
        const nums = parsed.map((x) => x);
        // avoid calling setState synchronously inside the effect to prevent cascading renders
        setTimeout(() => {
          setPresentedIds(nums);
        }, 0);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // persist presented ids
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(
        "presentation_presented_ids",
        JSON.stringify(presentedIds)
      );
    } catch {
      // ignore
    }
  }, [presentedIds]);

  const available = useMemo(() => {
    return interns.filter((i) => {
      if (presentedIds.includes(i.uid)) return false;
      if (gender !== "all" && i.gender !== gender) return false;
      if (onlyStudents && !i.isStudent) return false;
      if (onlyWifi && !i.hasWifi) return false;
      return true;
    });
  }, [interns, presentedIds, gender, onlyStudents, onlyWifi]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  function startTimer(seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    warningPlayedRef.current = false;
    setExpired(false);
    setCountdown(seconds);
    // clear any previous low-time repeating tone
    if (lowTimeIntervalRef.current) {
      clearInterval(lowTimeIntervalRef.current);
      lowTimeIntervalRef.current = null;
    }
    timerRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c === null) return null;
        const next = c - 1;
        // play one-shot warning when crossing 30s
        if (next <= 30 && next > 10 && !warningPlayedRef.current) {
          try {
            playWarningTone();
          } catch {}
          warningPlayedRef.current = true;
        }

        // under 10s, play repeating short beeps
        if (next <= 10 && next > 0) {
          if (!lowTimeIntervalRef.current) {
            // play immediate beep and start repeating interval
            try {
              playTone(1000, 120, "sine");
            } catch {}
            lowTimeIntervalRef.current = window.setInterval(() => {
              try {
                playTone(1000, 120, "sine");
              } catch {}
            }, 800) as unknown as number;
          }
        }

        if (next <= 0) {
          // time up — pause and mark expired; require manual Start to continue
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsRunning(false);
          if (lowTimeIntervalRef.current) {
            clearInterval(lowTimeIntervalRef.current);
            lowTimeIntervalRef.current = null;
          }
          try {
            playStopTone();
          } catch {}
          setExpired(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    setIsRunning(true);
  }

  // (stopTimer removed — pauseTimer / explicit clears are used now)

  function pauseTimer() {
    // stop intervals but keep the current countdown value so we can resume
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (lowTimeIntervalRef.current) {
      clearInterval(lowTimeIntervalRef.current);
      lowTimeIntervalRef.current = null;
    }
    // do not clear countdown — preserve remaining seconds
    setIsRunning(false);
  }

  function generateQueue(timerSeconds: number) {
    // build filtered pool and shuffle
    const pool = available.slice();
    const shuffled = shuffle(pool);
    // set up queue and chosen run length but do NOT auto-start the timer;
    // user must click Start to begin.
    setQueue(shuffled);
    setRunningTimerSeconds(timerSeconds);
    // clear any existing timers and low-time intervals
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (lowTimeIntervalRef.current) {
      clearInterval(lowTimeIntervalRef.current);
      lowTimeIntervalRef.current = null;
    }
    warningPlayedRef.current = false;
    setCountdown(null);
    setIsRunning(false);
  }

  function markPresented() {
    // remove the first member in queue and persist
    setQueue((q) => {
      if (q.length === 0) return q;
      const [first, ...rest] = q;
      setPresentedIds((p) => Array.from(new Set([...p, first.uid])));
      // advance queue but DO NOT auto-start the timer — user will click Start
      // clear expired/warning state and any running intervals
      setExpired(false);
      warningPlayedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (lowTimeIntervalRef.current) {
        clearInterval(lowTimeIntervalRef.current);
        lowTimeIntervalRef.current = null;
      }
      setCountdown(null);
      setIsRunning(false);
      // reshuffle the remaining queue so next presenter is unpredictable
      const shuffledRest = shuffle(rest);
      return shuffledRest;
    });
  }

  function skipOne() {
    setQueue((q) => {
      if (q.length <= 1) return q;
      const [first, ...rest] = q;
      // push first to end
      const next = [...rest, first];
      // reshuffle the remaining queue so next presenter is unpredictable
      const shuffledNext = shuffle(next);
      // do not restart timer — preserve manual start behavior
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (lowTimeIntervalRef.current) {
        clearInterval(lowTimeIntervalRef.current);
        lowTimeIntervalRef.current = null;
      }
      warningPlayedRef.current = false;
      setCountdown(null);
      setIsRunning(false);
      return shuffledNext;
    });
  }

  function resetPresented() {
    setPresentedIds([]);
    localStorage.removeItem("presentation_presented_ids");
    setQueue([]);
    setCountdown(null);
    setIsRunning(false);
    setExpired(false);
    setRunningTimerSeconds(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (lowTimeIntervalRef.current) {
      clearInterval(lowTimeIntervalRef.current);
      lowTimeIntervalRef.current = null;
    }
  }

  function formatCountdown(c: number | null) {
    if (c === null) return "—";
    if (c <= 0) return "0s remaining";
    const m = Math.floor(c / 60);
    const s = c % 60;
    if (m >= 1) {
      if (s === 0) return `${m}m remaining`;
      return `${m}m ${s}s remaining`;
    }
    return `${s}s remaining`;
  }

  return (
    <div className="min-h-screen bg-linear-to-b  p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Presenter Card */}
            <div className="bg-linear-to-br from-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 p-8 shadow-xl">
              {queue[0] ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* Avatar */}
                    <div className="w-48 h-48 rounded-xl overflow-hidden shrink-0 shadow-lg border-2 border-blue-500/30 hover:border-blue-500/60 transition-colors relative group">
                      <Image
                        src={
                          queue[0].avatar ||
                          (queue[0].social?.github
                            ? `https://github.com/${queue[0].social.github
                                .split("/")
                                .filter(Boolean)
                                .pop()}.png`
                            : "/default-avatar.png")
                        }
                        alt={queue[0].name}
                        width={192}
                        height={192}
                        className="object-cover w-full h-full"
                      />
                      {queue[0]?.isStudent ? (
                        <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                          <GraduationCap size={20} color="white" />
                        </div>
                      ) : null}
                    </div>

                    {/* Info & Controls */}
                    <div className="flex-1">
                      <h3 className="text-4xl font-bold text-white mb-1">
                        {queue[0].name}
                      </h3>
                      <p className="text-lg text-blue-400 mb-6">
                        {queue[0].position || "Intern"}
                      </p>

                      {/* Timer Display */}
                      <div
                        className={`mb-6 p-4 rounded-lg border-2 transition-all ${
                          expired
                            ? "bg-red-900/20 border-red-500/50"
                            : "bg-blue-900/20 border-blue-500/50"
                        }`}
                      >
                        <div className="text-sm text-gray-400 mb-1">
                          Time Remaining
                        </div>
                        <div
                          className={`text-3xl font-bold ${
                            expired ? "text-red-400" : "text-blue-400"
                          }`}
                        >
                          {expired ? "Time's Up!" : formatCountdown(countdown)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            isRunning
                              ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30"
                              : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30"
                          } text-white disabled:opacity-50`}
                          onClick={() => {
                            if (isRunning) {
                              pauseTimer();
                              return;
                            }
                            if (expired) {
                              markPresented();
                              return;
                            }
                            if (countdown !== null && queue.length > 0) {
                              startTimer(countdown);
                            } else if (queue.length > 0) {
                              startTimer(runningTimerSeconds);
                            }
                          }}
                        >
                          {isRunning
                            ? "⏸ Pause"
                            : expired
                            ? "▶ Start"
                            : countdown === null
                            ? "▶ Start"
                            : "▶ Resume"}
                        </button>

                        <button
                          className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                          onClick={() => markPresented()}
                          disabled={!queue[0]}
                        >
                          ✓ Mark Presented
                        </button>
                        <button
                          className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                          onClick={() => skipOne()}
                          disabled={queue.length <= 1}
                        >
                          ⤵ Skip
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No presenter in queue</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Generate a queue to get started
                  </p>
                </div>
              )}
            </div>

            {/* Upcoming Queue */}
            <div className="bg-neutral-800/50 rounded-2xl border border-neutral-700 p-6 backdrop-blur-sm">
              <h4 className="text-lg font-semibold text-white mb-4">
                Coming Up
              </h4>
              <div className="text-sm text-gray-400 mb-4 space-y-1">
                <div>
                  📊 {Math.max(0, queue.length - 1)} remaining presenters
                </div>
                <div>⏱ {formatCountdown(runningTimerSeconds)} per person</div>
                {queue.length > 1 && (
                  <div>
                    ⏲ Est. total:{" "}
                    {formatCountdown(
                      (queue.length - 1) * (runningTimerSeconds || 0)
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3">
                {queue.slice(1, 13).map((m, idx) => (
                  <div key={m.uid} className="shrink-0">
                    <div className="relative group">
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {idx + 1}. {m.name}
                      </div>
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-700 relative shadow-lg border border-neutral-600 hover:border-blue-500/50 transition-colors">
                        <Image
                          src={
                            m.avatar ||
                            (m.social?.github
                              ? `https://github.com/${m.social.github
                                  .split("/")
                                  .filter(Boolean)
                                  .pop()}.png`
                              : "/default-avatar.png")
                          }
                          alt={m.name}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                        {m.isStudent ? (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow-md border border-blue-400">
                            <GraduationCap size={12} color="white" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-linear-to-br from-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 p-6 shadow-xl space-y-6">
              <div>
                <label className="text-sm font-semibold text-white block mb-3">
                  Gender Filter
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as gender)}
                  className="w-full px-4 py-2 rounded-lg bg-neutral-700/50 text-white border border-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="all">All Genders</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-white block mb-3">
                  Filters
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={onlyStudents}
                      onChange={(e) => setOnlyStudents(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      Students Only
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={onlyWifi}
                      onChange={(e) => setOnlyWifi(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      Has Wi-Fi
                    </span>
                  </label>
                </div>
              </div>

              <div className="border-t border-neutral-700 pt-6">
                <div className="text-sm text-gray-400 mb-3">
                  <span className="font-semibold text-blue-400">
                    {available.filter((i) => i.uid !== queue[0]?.uid).length}
                  </span>{" "}
                  available presenters
                </div>
              </div>

              <div className="border-t border-neutral-700 pt-6">
                <label className="text-sm font-semibold text-white block mb-3">
                  Timer Settings
                </label>

                <div className="mb-4 space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      className="px-2 py-2 bg-neutral-700 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                      onClick={() => setRunningTimerSeconds((s) => s + 180)}
                    >
                      +3m
                    </button>
                    <button
                      type="button"
                      className="px-2 py-2 bg-neutral-700 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                      onClick={() => setRunningTimerSeconds((s) => s + 300)}
                    >
                      +5m
                    </button>
                    <button
                      type="button"
                      className="px-2 py-2 bg-neutral-700 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                      onClick={() => setRunningTimerSeconds((s) => s + 600)}
                    >
                      +10m
                    </button>
                    <button
                      type="button"
                      className="px-2 py-2 bg-neutral-700 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                      onClick={() => setRunningTimerSeconds((s) => s + 900)}
                    >
                      +15m
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    Duration
                  </div>
                  <div className="text-3xl font-bold text-blue-400 mb-4">
                    {formatCountdown(runningTimerSeconds)}
                  </div>
                  <div className="flex gap-1 bg-neutral-700/30 p-1 rounded-lg border border-neutral-600/50">
                    <button
                      type="button"
                      className="flex-1 px-2 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-neutral-600/50 rounded transition-colors"
                      onClick={() =>
                        setRunningTimerSeconds((s) => Math.max(5, s - 60))
                      }
                      title="Remove 1 minute"
                    >
                      −1m
                    </button>
                    <input
                      aria-label="Timer seconds"
                      type="number"
                      min={30}
                      value={runningTimerSeconds}
                      onChange={(e) =>
                        setRunningTimerSeconds(
                          Math.max(30, Number(e.target.value || 0))
                        )
                      }
                      className="flex-1 px-2 py-2 bg-transparent text-white text-sm font-medium text-center border-l border-r border-neutral-600/30 focus:outline-none"
                    />
                    <button
                      type="button"
                      className="flex-1 px-2 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-neutral-600/50 rounded transition-colors"
                      onClick={() => setRunningTimerSeconds((s) => s + 60)}
                      title="Add 1 minute"
                    >
                      +1m
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-emerald-600/30"
                    onClick={() => generateQueue(runningTimerSeconds)}
                  >
                    Generate Queue
                  </button>
                  <button
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-all"
                    onClick={() => resetPresented()}
                    title="Reset presented history"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
