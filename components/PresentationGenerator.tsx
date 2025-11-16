"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Intern } from "@/data/internsData";
import Image from "next/image";
import { GraduationCap } from "lucide-react";

type Props = { interns: Intern[] };

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
  const [gender, setGender] = useState<gender>("all");
  const [onlyStudents, setOnlyStudents] = useState(false);
  const [onlyWifi, setOnlyWifi] = useState(false);

  const [queue, setQueue] = useState<Intern[]>([]);
  const [presentedIds, setPresentedIds] = useState<number[]>([]);

  const [runningTimerSeconds, setRunningTimerSeconds] = useState<number>(0);
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
        const nums = parsed
          .map((x) => Number(x))
          .filter((n) => !Number.isNaN(n));
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
      if (presentedIds.includes(i.id)) return false;
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
      setPresentedIds((p) => Array.from(new Set([...p, first.id])));
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
    <div className=" p-4 rounded-lg shadow-md text-white">
      <div className="flex gap-6">
        <div className="flex-1 bg-gray-900 rounded border border-gray-800 p-4">
          <div className="mb-4">
            <div className="flex gap-4 items-center">
              <div className="w-56 h-56 bg-neutral-800 rounded overflow-hidden flex items-center justify-center relative">
                {queue[0] ? (
                  <>
                    <Image
                      src={
                        queue[0].avatar ||
                        (queue[0].socialLinks?.github
                          ? `https://github.com/${queue[0].socialLinks.github
                              .split("/")
                              .pop()}.png`
                          : "/default-avatar.png")
                      }
                      alt={queue[0].name}
                      width={224}
                      height={224}
                      className="object-cover w-full h-full"
                    />
                    {queue[0]?.isStudent ? (
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
                        <GraduationCap size={14} color="white" />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="text-gray-400">No member</div>
                )}
              </div>

              <div>
                <div className="text-3xl font-semibold">
                  {queue[0]?.name ?? "—"}
                </div>
                <div className="text-base text-gray-300">
                  {queue[0]?.position ?? ""}
                </div>
                <div className="mt-3">
                  <div className="text-sm">
                    {expired ? (
                      <span className="text-red-400">
                        Time&apos;s up — click Start
                      </span>
                    ) : (
                      `Timer: ${formatCountdown(countdown)}`
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {/* Single toggle button: Pause when running, Resume/Start when paused/expired */}
                    <button
                      className={`px-3 py-1 rounded ${
                        isRunning ? "bg-red-600" : "bg-blue-600"
                      }`}
                      onClick={() => {
                        if (isRunning) {
                          pauseTimer();
                          return;
                        }
                        // not running: if expired -> mark presented and advance
                        if (expired) {
                          markPresented();
                          return;
                        }
                        // resume from saved countdown if present, otherwise start fresh
                        if (countdown !== null && queue.length > 0) {
                          startTimer(countdown);
                        } else if (queue.length > 0) {
                          startTimer(runningTimerSeconds);
                        }
                      }}
                    >
                      {isRunning
                        ? "Pause"
                        : expired
                        ? "Start"
                        : countdown === null
                        ? "Start"
                        : "Resume"}
                    </button>

                    <button
                      className="px-3 py-1 bg-emerald-600 rounded"
                      onClick={() => markPresented()}
                      disabled={!queue[0]}
                    >
                      Mark Presented
                    </button>
                    <button
                      className="px-3 py-1 bg-slate-600 rounded"
                      onClick={() => skipOne()}
                      disabled={queue.length <= 1}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Upcoming</h4>
            <div className="text-xs text-gray-400 mb-2">
              {Math.max(0, queue.length - 1)} remaining • Per person:{" "}
              {formatCountdown(runningTimerSeconds)}
              {queue.length > 1 ? (
                <span>
                  {" "}
                  • Est total:{" "}
                  {formatCountdown(
                    (queue.length - 1) * (runningTimerSeconds || 0)
                  )}
                </span>
              ) : null}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {queue.slice(1, 13).map((m) => (
                <div key={m.id} className="w-20 text-center">
                  <div className="w-20 h-20 rounded overflow-hidden bg-neutral-800 mx-auto relative">
                    <Image
                      src={
                        m.avatar ||
                        (m.socialLinks?.github
                          ? `https://github.com/${m.socialLinks.github
                              .split("/")
                              .pop()}.png`
                          : "/default-avatar.png")
                      }
                      alt={m.name}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                    {m.isStudent ? (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-700 flex items-center justify-center">
                        <GraduationCap size={12} color="white" />
                      </div>
                    ) : null}
                  </div>
                  <div className="text-xs mt-1 truncate">{m.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="w-80">
          <div className="bg-neutral-800 p-3 rounded">
            <label className="text-sm block mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as gender)}
              className="w-full px-2 py-1 rounded bg-neutral-700 text-white"
            >
              <option value="all">All</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>

            <div className="mt-3">
              <label className="text-sm block mb-1">Filters</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyStudents}
                    onChange={(e) => setOnlyStudents(e.target.checked)}
                  />
                  <span className="text-sm">Students</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyWifi}
                    onChange={(e) => setOnlyWifi(e.target.checked)}
                  />
                  <span className="text-sm">Has Wi‑Fi</span>
                </label>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-300">
              {available.filter((i) => i.id !== queue[0]?.id).length} available
            </div>

            <div className="mt-4">
              <div className="flex justify-between">
                <label className="text-sm block mb-1">Timer</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="text-sm px-2 py-0.5 "
                    onClick={() => setRunningTimerSeconds((s) => s + 300)}
                  >
                    +5m
                  </button>
                  <button
                    type="button"
                    className="text-sm px-2 py-0.5 "
                    onClick={() => setRunningTimerSeconds((s) => s + 600)}
                  >
                    +10m
                  </button>
                  <button
                    type="button"
                    className="text-sm px-2 py-0.5 "
                    onClick={() => setRunningTimerSeconds((s) => s + 900)}
                  >
                    +15m
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-300 mb-2">
                  Selected time: {formatCountdown(runningTimerSeconds)}
                </div>
                <input
                  aria-label="Timer seconds"
                  type="number"
                  min={5}
                  value={runningTimerSeconds}
                  onChange={(e) =>
                    setRunningTimerSeconds(
                      Math.max(5, Number(e.target.value || 0))
                    )
                  }
                  className="w-full px-2 py-1 rounded bg-neutral-700 text-white"
                />

                <div className="mt-3 flex gap-2">
                  <button
                    className="flex-1 px-3 py-1 bg-emerald-600 rounded hover:opacity-90"
                    onClick={() => generateQueue(runningTimerSeconds)}
                  >
                    Generate Queue
                  </button>

                  <button
                    className="px-3 py-1 bg-yellow-600 rounded hover:opacity-90"
                    onClick={() => resetPresented()}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
