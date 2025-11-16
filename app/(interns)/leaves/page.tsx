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
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Leaves</h2>

      <form onSubmit={applyLeave} className="bg-dark p-4 rounded mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-sm text-gray-400">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full bg-transparent border rounded px-2 py-1"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full bg-transparent border rounded px-2 py-1"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">&nbsp;</label>
            <div>
              <button
                type="submit"
                disabled={!canSubmit || saving}
                className="px-3 py-1 rounded bg-blue-600 text-white"
              >
                {saving ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label className="text-sm text-gray-400">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full bg-transparent border rounded px-2 py-2"
            rows={3}
            placeholder="Brief reason for leave"
          />
        </div>

        {error ? (
          <div className="text-sm text-red-400 mt-2">{error}</div>
        ) : null}
      </form>

      <section>
        <h3 className="text-lg font-medium mb-3">Your requests</h3>
        {leaves.length === 0 ? (
          <div className="text-sm text-gray-400">No leave requests yet.</div>
        ) : (
          <div className="space-y-3">
            {leaves.map((l) => (
              <div
                key={l.id}
                className="bg-dark p-3 rounded flex justify-between items-center"
              >
                <div>
                  <div className="text-sm text-gray-400">
                    {l.startDate} → {l.endDate}
                  </div>
                  <div className="text-sm mt-1">{l.reason ?? "—"}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Status:{" "}
                    <strong
                      className={
                        l.status === "approved"
                          ? "text-green-400"
                          : l.status === "rejected"
                          ? "text-red-400"
                          : "text-yellow-300"
                      }
                    >
                      {l.status}
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {l.status === "pending" ? (
                    <button
                      onClick={() => cancelLeave(l.id, l.status)}
                      className="px-2 py-1 rounded bg-red-600 text-white text-sm"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
