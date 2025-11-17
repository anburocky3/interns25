"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  type Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Head from "next/head";
import { formatIsoDate } from "@/lib/helpers";

type LeaveStatus = "pending" | "approved" | "rejected";

type LeaveDoc = {
  id: string;
  userId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  reason?: string | null;
  status: LeaveStatus;
  createdAt?: Timestamp | null;
  reviewedBy?: string | null;
  reviewedAt?: Timestamp | null;
};

export default function LeavesPage() {
  const { user, loading } = useAuth();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [leaves, setLeaves] = useState<LeaveDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const leavesRef = collection(db, "leaves");
    const q = query(
      leavesRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const items: LeaveDoc[] = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          userId: data.userId,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason ?? null,
          status: (data.status as LeaveStatus) ?? "pending",
          createdAt: data.createdAt ?? null,
          reviewedBy: data.reviewedBy ?? null,
          reviewedAt: data.reviewedAt ?? null,
        } satisfies LeaveDoc;
      });
      setLeaves(items);
    });

    return () => unsub();
  }, [user]);

  const canSubmit = useMemo(() => {
    if (!startDate || !endDate) return false;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return s.getTime() <= e.getTime();
  }, [startDate, endDate]);

  const applyLeave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) return setError("You must be logged in to apply for leave.");
    if (!canSubmit) return setError("Please provide a valid date range.");
    setError(null);
    setSaving(true);
    try {
      const leavesRef = collection(db, "leaves");
      await addDoc(leavesRef, {
        userId: user.uid,
        startDate,
        endDate,
        reason: reason || null,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err) {
      console.error(err);
      setError("Failed to apply for leave. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancelLeave = async (id: string, status: LeaveStatus) => {
    if (status !== "pending") return;
    if (!confirm("Cancel this pending leave request?")) return;
    try {
      await deleteDoc(doc(db, "leaves", id));
    } catch (err) {
      console.error(err);
      setError("Failed to cancel leave.");
    }
  };

  if (loading) return <div className="p-6">Checking auth...</div>;
  if (!user)
    return (
      <div className="p-6 text-red-400">Please login to manage leaves.</div>
    );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Head>
        <title>Leave Requests - CyberDude Interns Portal</title>
      </Head>
      <div className="rounded-2xl overflow-hidden bg-linear-to-br from-indigo-700 to-fuchsia-600 p-6 text-white shadow-2xl mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Leave Requests</h1>
            <p className="text-sm text-indigo-100/80 mt-1">
              Apply for time off and track approval status in real-time.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-80">Active requests</div>
            <div className="text-xl font-semibold">{leaves.length}</div>
          </div>
        </div>
      </div>

      <form
        onSubmit={applyLeave}
        className="bg-white/5 backdrop-blur-md border border-white/6 p-6 rounded-2xl mb-6 shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs text-slate-300">Start Date</label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg px-3 py-2 bg-slate-800/60 text-white border border-white/6 focus:ring-2 focus:ring-fuchsia-400/40"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">End Date</label>
            <input
              type="date"
              value={endDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg px-3 py-2 bg-slate-800/60 text-white border border-white/6 focus:ring-2 focus:ring-fuchsia-400/40"
              required
            />
          </div>
          <div className="md:col-span-1 flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="w-full md:w-auto px-4 py-2 rounded-full bg-linear-to-r from-fuchsia-500 to-rose-500 text-white font-semibold shadow hover:brightness-105 disabled:opacity-60"
            >
              {saving ? "Applying..." : "Apply"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setReason("");
              }}
              className="hidden md:inline-block px-4 py-2 rounded-full bg-white/6 text-white"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-300">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2 w-full rounded-lg px-3 py-3 bg-slate-800/60 text-white border border-white/6 focus:ring-2 focus:ring-fuchsia-400/30"
            rows={3}
            placeholder="Brief reason for leave"
          />
        </div>

        {error ? (
          <div className="text-sm text-rose-400 mt-3">{error}</div>
        ) : null}
      </form>

      <section>
        <h3 className="text-lg font-semibold mb-4">Your requests</h3>
        {leaves.length === 0 ? (
          <div className="text-sm text-slate-400">
            No leave requests yet — submit one above.
          </div>
        ) : (
          <div className="space-y-4">
            {leaves.map((l) => {
              const accent =
                l.status === "approved"
                  ? "bg-emerald-500/20 border-emerald-500"
                  : l.status === "rejected"
                  ? "bg-rose-500/10 border-rose-500"
                  : "bg-yellow-400/10 border-yellow-400";
              return (
                <div
                  key={l.id}
                  className={`p-4 rounded-2xl border-l-4 ${accent} backdrop-blur-sm flex justify-between items-start gap-4`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-200 font-medium">
                        {formatIsoDate(l.startDate)} →{" "}
                        {formatIsoDate(l.endDate)}
                      </div>
                      <div
                        className="px-2 py-0.5 rounded-full text-xs font-medium text-white/90"
                        style={{
                          background:
                            l.status === "approved"
                              ? "#10B981"
                              : l.status === "rejected"
                              ? "#EF4444"
                              : "#F59E0B",
                        }}
                      >
                        {l.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-sm text-slate-300 mt-2">
                      {l.reason ?? "—"}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      Submitted:{" "}
                      {l.createdAt
                        ? new Date(l.createdAt.seconds * 1000).toLocaleString()
                        : "—"}
                    </div>
                    {l.reviewedBy && (
                      <div className="text-xs text-slate-400">
                        Reviewed by: {l.reviewedBy}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {l.status === "pending" ? (
                      <button
                        onClick={() => cancelLeave(l.id, l.status)}
                        className="px-3 py-1 rounded-full bg-rose-500 text-white hover:bg-rose-400"
                      >
                        Cancel
                      </button>
                    ) : (
                      <div className="text-xs text-slate-300">&nbsp;</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
