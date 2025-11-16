"use client";
import React, { useMemo, useState } from "react";
import type { Intern } from "@/data/internsData";
import InternCard from "@/components/InternCard";

export default function InternGrid({ interns }: { interns: Intern[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "student" | "wifi">("all");
  // no modal selection — render cards directly

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return interns.filter((i) => {
      if (filter === "student" && !i.isStudent) return false;
      if (filter === "wifi" && !i.hasWifi) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        (i.email || "").toLowerCase().includes(q) ||
        (i.mobile || "").toLowerCase().includes(q)
      );
    });
  }, [interns, query, filter]);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search interns by name, email or mobile..."
            className="w-full sm:w-96 px-3 py-2 rounded-md bg-neutral-800 text-white border border-neutral-700"
          />
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | "student" | "wifi")
            }
            className="px-3 py-2 rounded-md bg-neutral-800 text-white border border-neutral-700"
          >
            <option value="all">All</option>
            <option value="student">Students</option>
            <option value="wifi">Has Wi‑Fi</option>
          </select>
        </div>

        <div className="text-sm text-gray-300">
          Showing {filtered.length} / {interns.length}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((intern) => (
          <InternCard key={intern.id} intern={intern} />
        ))}
      </div>
    </div>
  );
}
