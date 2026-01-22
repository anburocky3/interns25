"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  updateTypingStats,
  getUserTypingStats,
  getTopTypingLeaders,
} from "@/lib/typingStats";
import { RotateCcw, Play, Crown } from "lucide-react";
import { GameResult, InternProfile, TypingStats } from "@/types";
import Image from "next/image";
import { githubAvatarFromUrl } from "@/lib/helpers";

const TYPING_TEST_DURATION = 60; // seconds
const CODING_SENTENCES = [
  "React uses a virtual DOM to optimize rendering performance.",
  "TypeScript provides type safety for large JavaScript applications.",
  "Firebase Firestore offers real-time database synchronization.",
  "Next.js enables server-side rendering for React applications.",
  "Tailwind CSS allows rapid UI development with utility classes.",
  "The event loop is the core of JavaScript's asynchronous model.",
  "REST APIs follow the principles of Representational State Transfer.",
  "Hooks allow you to use state in functional React components.",
  "GraphQL provides a flexible alternative to traditional REST APIs.",
  "Middleware functions can modify request and response objects.",
  "Authentication tokens should be stored securely on the client.",
  "Database indexes significantly improve query performance.",
  "Debouncing helps prevent excessive function calls during events.",
  "State management libraries help organize application data flow.",
  "API rate limiting protects servers from abuse and overload.",
  "Version control systems track changes and enable team collaboration.",
  "Code reviews improve quality and spread knowledge across teams.",
  "Continuous integration automates testing and deployment pipelines.",
  "Containerization with Docker ensures consistency across environments.",
  "Kubernetes orchestrates and manages containerized applications at scale.",
  "Microservices architecture breaks applications into independent services.",
  "Load balancing distributes traffic across multiple servers effectively.",
  "Caching strategies reduce database queries and improve response times.",
  "Regular expressions provide powerful pattern matching capabilities.",
  "Async await syntax makes asynchronous code more readable and clean.",
  "Arrow functions provide concise syntax for function definitions.",
  "Destructuring allows extracting values from objects and arrays.",
  "Template literals enable string interpolation and multiline strings.",
  "Spread operator facilitates copying and combining arrays and objects.",
  "Promises handle asynchronous operations with success and error states.",
  "WebSockets enable real-time bidirectional communication between clients.",
  "Progressive Web Apps provide native app experiences on the web.",
  "Service workers enable offline functionality and background sync.",
  "API documentation should be clear comprehensive and easy to understand.",
  "Testing frameworks help ensure code reliability and catch regressions.",
  "Git branching strategies enable parallel development and safe integration.",
  "CSS Grid provides powerful two-dimensional layout capabilities.",
  "Flexbox simplifies responsive design and element alignment tasks.",
  "Mobile first design ensures optimal experience on all devices.",
  "Accessibility standards make applications usable by everyone.",
  "Performance optimization reduces load times and improves user experience.",
  "Security vulnerabilities require constant vigilance and timely patches.",
  "Documentation serves as the foundation for project understanding.",
  "Code refactoring improves structure without changing functionality.",
  "Design patterns provide proven solutions to common problems.",
  "SOLID principles guide object-oriented design and architecture.",
  "DRY principle eliminates code duplication and promotes maintainability.",
  "KISS philosophy advocates keeping solutions simple and understandable.",
];

export default function TypingTestModule() {
  const { user } = useAuth();

  // Game state
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">(
    "idle",
  );
  const [timeLeft, setTimeLeft] = useState(TYPING_TEST_DURATION);
  const [currentInput, setCurrentInput] = useState("");
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [gameResult, setGameResult] = useState<
    (GameResult & { previousBestWPM: number }) | null
  >(null);
  const [leaders, setLeaders] = useState<
    (InternProfile & { bestWPM: number; bestAccuracy: number })[]
  >([]);
  const [leadersLoading, setLeadersLoading] = useState(false);
  const [leadersError, setLeadersError] = useState<string | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");

  // Get random sentence
  const getRandomSentence = () => {
    return CODING_SENTENCES[
      Math.floor(Math.random() * CODING_SENTENCES.length)
    ];
  };

  // Load user's stats on mount
  useEffect(() => {
    const loadStats = async () => {
      if (user) {
        const userStats = await getUserTypingStats(user.uid);
        setStats(userStats);
      }
    };
    const loadLeaders = async () => {
      try {
        setLeadersLoading(true);
        setLeadersError(null);
        const top = await getTopTypingLeaders(10);
        setLeaders(top);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
        setLeadersError("Could not load leaderboard");
      } finally {
        setLeadersLoading(false);
      }
    };

    loadStats();
    loadLeaders();
  }, [user]);

  // Timer effect
  useEffect(() => {
    if (gameState !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("finished");
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Focus input when game starts
  useEffect(() => {
    if (gameState === "playing") {
      inputRef.current?.focus();
    }
  }, [gameState]);

  // Calculate metrics
  const calculateMetrics = () => {
    const correctChars = Array.from(currentInput).filter(
      (char, idx) => char === selectedText[idx],
    ).length;

    const totalChars = currentInput.length;
    const timeElapsed = TYPING_TEST_DURATION - timeLeft;
    const minutes = Math.max(timeElapsed / 60, 0.01); // Avoid division by zero
    const wpm = Math.round(correctChars / 5 / minutes);
    const accuracy =
      totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;

    return { wpm, accuracy, correctChars, totalChars };
  };

  // Start game
  const handleStart = () => {
    setSelectedText(getRandomSentence());
    setGameState("playing");
    setTimeLeft(TYPING_TEST_DURATION);
    setCurrentInput("");
    setGameResult(null);
    inputRef.current?.focus();
  };

  // Handle finish
  const handleFinish = async () => {
    if (gameState !== "playing") return;

    const { wpm, accuracy, correctChars, totalChars } = calculateMetrics();

    try {
      if (!user) {
        console.error("User is not authenticated");
        return; // or throw new Error('User must be authenticated');
      }

      const result = await updateTypingStats(user.uid, {
        wpm,
        accuracy,
        correctChars,
        totalChars,
      });
      setGameResult(result);
    } catch (error) {
      console.error("Error finishing game:", error);
    }

    setGameState("finished");
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentInput(value);

    // Auto-finish when user types the entire sentence
    if (value.length === selectedText.length && gameState === "playing") {
      setGameState("finished");
      // Call handleFinish after a tick to ensure state is updated
      setTimeout(() => {
        handleFinish();
      }, 0);
    }
  };

  // Render text with character highlighting
  const renderHighlightedText = () => {
    return (
      <div className="flex flex-wrap gap-0.5 font-mono text-lg leading-relaxed">
        {Array.from(selectedText).map((char, idx) => {
          const inputChar = currentInput[idx];
          let colorClass = "text-gray-400"; // Not yet typed

          if (inputChar !== undefined) {
            colorClass = inputChar === char ? "text-green-400" : "text-red-500";
          }

          return (
            <span key={idx} className={`${colorClass} transition-colors`}>
              {char === " " ? "·" : char}
            </span>
          );
        })}
      </div>
    );
  };

  // Calculate current metrics
  const metrics = calculateMetrics();

  return (
    <div className="m-10 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="col-span-2 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-2xl shadow-2xl border border-white/10 h-fit">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Typing Speed Test</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Best: </span>
              <span className="text-xl font-bold text-emerald-400">
                {stats?.bestWPM || 0} WPM
              </span>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Type the text below as fast and accurately as possible in 60 seconds
          </p>
        </div>

        {/* Game Content */}
        {gameState === "idle" && (
          <div className="space-y-8">
            <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
              <div className="text-gray-300 mb-4">
                Ready to test your speed?
              </div>
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg flex items-center gap-2 mx-auto transition"
              >
                <Play className="w-5 h-5" />
                Start Test
              </button>
            </div>

            {stats && stats.bestWPM > 0 && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <h3 className="font-semibold text-emerald-300 mb-2">
                  📊 Your Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Best WPM</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {stats.bestWPM}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Best Accuracy</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {stats.bestAccuracy}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Games Played</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {stats.totalGamesPlayed || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">This Month</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {stats.gamesThisMonth || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === "playing" && (
          <div className="space-y-6">
            {/* Timer */}
            <div className="flex justify-center">
              <div
                className={`text-6xl font-bold font-mono ${
                  timeLeft <= 10
                    ? "text-red-500 animate-pulse"
                    : "text-blue-400"
                }`}
              >
                {String(timeLeft).padStart(2, "0")}
              </div>
            </div>

            {/* Text Display */}
            <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg min-h-32 flex items-center justify-center">
              {renderHighlightedText()}
            </div>

            {/* Input Field */}
            <div className="space-y-2">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={handleInputChange}
                placeholder="Start typing here..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                disabled={gameState !== "playing"}
              />
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                <div className="text-xs text-gray-400">WPM</div>
                <div className="text-2xl font-bold text-blue-400">
                  {metrics.wpm}
                </div>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                <div className="text-xs text-gray-400">Accuracy</div>
                <div className="text-2xl font-bold text-green-400">
                  {metrics.accuracy}%
                </div>
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
                <div className="text-xs text-gray-400">Chars</div>
                <div className="text-2xl font-bold text-purple-400">
                  {metrics.correctChars}/{metrics.totalChars}
                </div>
              </div>
            </div>

            {/* Finish Button */}
            <button
              onClick={handleFinish}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              Finish Test
            </button>
          </div>
        )}

        {gameState === "finished" && gameResult && (
          <div className="space-y-6">
            {/* Result Animation */}
            {gameResult.isNewRecord && (
              <div className="p-6 bg-linear-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg text-center animate-pulse">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-xl font-bold text-yellow-300">
                  New High Score!
                </div>
              </div>
            )}

            {/* Results Card */}
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <h3 className="font-semibold text-emerald-300 mb-4">
                ✅ Test Complete
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-gray-400 text-sm">Words Per Minute</div>
                  <div className="text-3xl font-bold text-emerald-400">
                    {gameResult.wpm}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Accuracy</div>
                  <div className="text-3xl font-bold text-emerald-400">
                    {gameResult.accuracy}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">
                    Correct Characters
                  </div>
                  <div className="text-xl font-bold text-emerald-400">
                    {gameResult.correctChars}/{gameResult.totalChars}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">
                    {gameResult.isNewRecord ? "Previous Best" : "Your Best"}
                  </div>
                  <div className="text-xl font-bold text-emerald-400">
                    {gameResult.previousBestWPM} WPM
                  </div>
                </div>
              </div>

              {!gameResult.isNewRecord && gameResult.previousBestWPM > 0 && (
                <div className="text-sm text-gray-300">
                  Keep practicing! You need{" "}
                  {gameResult.previousBestWPM - gameResult.wpm + 1} more WPM to
                  beat your record.
                </div>
              )}
            </div>

            {/* Retry Button */}
            <button
              onClick={handleStart}
              className="w-full px-4 py-3 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-gray-200 tracking-wide">
            Top 10 Typing Heroes
          </h3>
        </div>
        {leadersLoading && (
          <div className="text-sm text-gray-400">Loading leaderboard...</div>
        )}
        {leadersError && (
          <div className="text-sm text-rose-400">{leadersError}</div>
        )}
        {!leadersLoading && !leadersError && leaders.length === 0 && (
          <div className="text-sm text-gray-400">
            No scores yet. Be the first!
          </div>
        )}
        {!leadersLoading && !leadersError && leaders.length > 0 && (
          <div className="space-y-2">
            {leaders.map((leader, idx) => (
              <div
                key={leader.uid}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300 bg-slate-800/50 border border-white/5 hover:border-white/20 hover:shadow-lg hover:shadow-white/10`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`relative w-12 h-12 rounded-full overflow-hidden bg-linear-to-br  from-indigo-500 via-purple-500 to-blue-500 shadow-lg ${
                      idx < 3
                        ? "border-2 border-yellow-500"
                        : "border border-white/10"
                    }`}
                  >
                    {leader.social?.github ? (
                      <Image
                        src={githubAvatarFromUrl(leader.social?.github) || ""}
                        alt={leader.name || "User"}
                        width={48}
                        height={48}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-black/30" />
                    )}
                    <div className="absolute inset-0 bg-black/40" />
                    <div
                      className={`absolute -top-2 -right-2  rounded-full w-15 h-15 flex items-center justify-center  text-white font-semibold shadow-lg bg-slate-800/50 border border-white/5`}
                    >
                      #{idx + 1}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {leader.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      Accuracy: {leader.bestAccuracy}%
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-400">
                  {leader.bestWPM} WPM
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
