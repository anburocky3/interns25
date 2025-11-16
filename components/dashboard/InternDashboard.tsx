"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type SocialLinks = {
  twitter?: string | null;
  linkedin?: string | null;
  github?: string | null;
  website?: string | null;
};

const DEFAULT_START_DATE = "2025-10-31";
const DEFAULT_END_DATE = "2026-04-30";

export default function InternDashboard() {
  const { user, loading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [leavesTaken, setLeavesTaken] = useState<number>(0);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [social, setSocial] = useState<SocialLinks>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as
        | ({ leavesTaken?: number; startDate?: string; endDate?: string } & {
            social?: SocialLinks;
          })
        | undefined;
      setLeavesTaken(data?.leavesTaken ?? 0);
      setStartDate(data?.startDate ?? DEFAULT_START_DATE);
      setEndDate(data?.endDate ?? DEFAULT_END_DATE);
      setSocial(data?.social ?? {});
      setProfileLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Keep leavesTaken in sync with approved leaves in the `leaves` collection.
  useEffect(() => {
    if (!user) return;
    const leavesRef = doc(db, "users", user.uid); // placeholder: external listener keeps count elsewhere
    // The page-level listener updates leavesTaken from `leaves` collection; keep this component's own value if needed
    return () => {};
  }, [user]);

  const daysBetween = (fromIso: string | null, toIso: string | null) => {
    if (!fromIso || !toIso) return 0;
    try {
      const from = new Date(fromIso);
      const to = new Date(toIso);
      const ms = to.getTime() - from.getTime();
      return Math.ceil(ms / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const daysPassed = () => {
    const startIso = startDate ?? DEFAULT_START_DATE;
    const now = new Date();
    const start = new Date(startIso);
    const ms = now.getTime() - start.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  };

  const totalInternDays = () => {
    const s = startDate ?? DEFAULT_START_DATE;
    const e = endDate ?? DEFAULT_END_DATE;
    return daysBetween(s, e);
  };

  const daysRemaining = () => {
    const endIso = endDate ?? DEFAULT_END_DATE;
    const now = new Date();
    const end = new Date(endIso);
    const ms = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  const saveSocial = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const ref = doc(db, "users", user.uid);
      await setDoc(ref, { social }, { merge: true });
      setEditing(false);
    } catch (err) {
      console.error("Error saving social links:", err);
      // optionally show a UI error
    } finally {
      setSaving(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="p-8">
        <div className="text-sm text-gray-300">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-red-400">You must be logged in to view the dashboard.</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-dark p-4 rounded">
          <div className="text-sm text-gray-400">Leaves Taken</div>
          <div className="text-3xl font-semibold">{leavesTaken}</div>
        </div>
        <div className="bg-dark p-4 rounded">
          <div className="text-sm text-gray-400">Days Passed</div>
          <div className="text-3xl font-semibold">{daysPassed()}</div>
        </div>
        <div className="bg-dark p-4 rounded">
          <div className="text-sm text-gray-400">Days Remaining</div>
          <div className="text-3xl font-semibold">{daysRemaining()}</div>
        </div>
      </section>

      <section className="bg-dark p-6 rounded">
        <h2 className="text-lg font-medium mb-4">Internship Dates</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <div className="text-sm text-gray-400">Start Date</div>
            <div className="mt-1 text-sm">{startDate ?? "Not set"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">End Date</div>
            <div className="mt-1 text-sm">{endDate ?? "Not set"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Total Days</div>
            <div className="mt-1 text-sm">{totalInternDays()}</div>
          </div>
        </div>
      </section>

      <section className="bg-dark p-6 rounded mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Social Links</h2>
          <div>
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="mr-2 px-3 py-1 rounded bg-gray-700/40"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSocial}
                  disabled={saving}
                  className="px-3 py-1 rounded bg-blue-600 text-white"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1 rounded bg-blue-600 text-white"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">Twitter</label>
            {editing ? (
              <input
                value={social.twitter ?? ""}
                onChange={(e) => setSocial((s) => ({ ...s, twitter: e.target.value }))}
                className="mt-1 w-full bg-transparent border rounded px-2 py-1"
                placeholder="https://twitter.com/yourhandle"
              />
            ) : (
              <div className="mt-1 text-sm text-blue-300">{social.twitter ?? "—"}</div>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-400">LinkedIn</label>
            {editing ? (
              <input
                value={social.linkedin ?? ""}
                onChange={(e) => setSocial((s) => ({ ...s, linkedin: e.target.value }))}
                className="mt-1 w-full bg-transparent border rounded px-2 py-1"
                placeholder="https://linkedin.com/in/yourhandle"
              />
            ) : (
              <div className="mt-1 text-sm text-blue-300">{social.linkedin ?? "—"}</div>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-400">GitHub</label>
            {editing ? (
              <input
                value={social.github ?? ""}
                onChange={(e) => setSocial((s) => ({ ...s, github: e.target.value }))}
                className="mt-1 w-full bg-transparent border rounded px-2 py-1"
                placeholder="https://github.com/yourhandle"
              />
            ) : (
              <div className="mt-1 text-sm text-blue-300">{social.github ?? "—"}</div>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-400">Website</label>
            {editing ? (
              <input
                value={social.website ?? ""}
                onChange={(e) => setSocial((s) => ({ ...s, website: e.target.value }))}
                className="mt-1 w-full bg-transparent border rounded px-2 py-1"
                placeholder="https://yourwebsite.com"
              />
            ) : (
              <div className="mt-1 text-sm text-blue-300">{social.website ?? "—"}</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
