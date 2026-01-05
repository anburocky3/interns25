"use client";
import React, { useMemo, useState } from "react";
import InternCard from "@/components/InternCard";
import { InternProfile } from "@/types";
import { Mars, Venus } from "lucide-react";

export default function InternGrid({ interns }: { interns: InternProfile[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "student" | "wifi">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "M" | "F">("all");
  // no modal selection — render cards directly

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return interns.filter((i) => {
      if (filter === "student" && !i.isStudent) return false;
      if (filter === "wifi" && !i.hasWifi) return false;
      if (genderFilter !== "all" && i.gender !== genderFilter) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        (i.email || "").toLowerCase().includes(q) ||
        (i.mobile || "").toLowerCase().includes(q)
      );
    });
  }, [interns, query, filter, genderFilter]);

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email or mobile..."
                className="w-full px-4 py-3 rounded-lg bg-neutral-700/50 text-white border border-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-gray-500"
              />
            </div>

            {/* Filter Select */}
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as "all" | "student" | "wifi")
              }
              className="px-4 py-3 rounded-lg bg-neutral-700/50 text-white border border-neutral-600 focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">All Interns</option>
              <option value="student">Students Only</option>
              <option value="wifi">Has Wi-Fi</option>
            </select>

            {/* Gender Filters */}
            <div className="flex items-center gap-2 bg-neutral-700/50 px-3 py-2 rounded-lg border border-neutral-600">
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                Gender:
              </span>
              <button
                onClick={() =>
                  setGenderFilter(genderFilter === "M" ? "all" : "M")
                }
                className={`p-2 rounded-md transition-all ${
                  genderFilter === "M"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Filter by Male"
                aria-label="Filter by male"
              >
                <Mars size={18} />
              </button>
              <button
                onClick={() =>
                  setGenderFilter(genderFilter === "F" ? "all" : "F")
                }
                className={`p-2 rounded-md transition-all ${
                  genderFilter === "F"
                    ? "bg-pink-600 text-white shadow-lg shadow-pink-600/50"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Filter by Female"
                aria-label="Filter by female"
              >
                <Venus size={18} />
              </button>
            </div>
          </div>

          {/* Results Counter */}
          <div className="text-right bg-neutral-700/30 px-3 py-2 rounded-lg">
            <div className="text-sm text-gray-300">
              <span className="font-semibold text-white">
                {filtered.length}
              </span>
              <span className="text-gray-500"> / {interns.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interns Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((intern) => (
            <InternCard key={intern.uid} intern={intern} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            No interns match your filters.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setFilter("all");
              setGenderFilter("all");
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
