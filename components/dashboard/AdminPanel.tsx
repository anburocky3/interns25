"use client";
import React, { useEffect, useState } from "react";
import {
  getAllUsersProjectWeeks,
  updateProjectWeekStatus,
} from "@/lib/projectWeeks";
import { ProjectWeekEntry } from "@/components/ProjectUpdatesModal";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  type DocumentData,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function AdminPanel() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<
    Array<DocumentData & { id: string }>
  >([]);
  const [loadingReq, setLoadingReq] = useState(true);
  const [projectWeeks, setProjectWeeks] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const leavesRef = collection(db, "leaves");
    const q = query(leavesRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as DocumentData),
      }));
      setRequests(items);
      setLoadingReq(false);
    });
    return () => unsub();
  }, []);

  // Fetch all users' project weeks
  useEffect(() => {
    setLoadingProjects(true);
    getAllUsersProjectWeeks()
      .then(setProjectWeeks)
      .catch(() => setError("Failed to load project weeks."))
      .finally(() => setLoadingProjects(false));
  }, []);
  const handleAdminAction = async (
    uid: string,
    week: number,
    status: "accepted" | "rejected",
  ) => {
    try {
      await updateProjectWeekStatus(uid, week, status);
      setProjectWeeks((prev) =>
        prev.map((user) =>
          user.uid === uid
            ? {
                ...user,
                weeks: user.weeks.map((w: ProjectWeekEntry) =>
                  w.week === week ? { ...w, status } : w,
                ),
              }
            : user,
        ),
      );
    } catch {
      setError("Failed to update project status.");
    }
  };

  const approve = async (id: string) => {
    if (!user) return;
    try {
      const ref = doc(db, "leaves", id);
      await updateDoc(ref, {
        status: "approved",
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Approve error", err);
    }
  };

  const reject = async (id: string) => {
    if (!user) return;
    try {
      const ref = doc(db, "leaves", id);
      await updateDoc(ref, {
        status: "rejected",
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Reject error", err);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin — Leave Requests</h1>
      {loadingReq ? (
        <div className="text-sm text-gray-400">Loading requests...</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-dark p-4 rounded flex justify-between items-start"
            >
              <div>
                <div className="text-sm text-gray-400">
                  {r.startDate} → {r.endDate}
                </div>
                <div className="font-medium">{r.reason ?? "—"}</div>
                <div className="text-xs text-gray-500 mt-1">
                  By: {String(r.userId)}
                </div>
                <div className="text-xs mt-1">
                  Status:{" "}
                  <strong
                    className={
                      r.status === "approved"
                        ? "text-green-400"
                        : r.status === "rejected"
                          ? "text-red-400"
                          : "text-yellow-300"
                    }
                  >
                    {r.status}
                  </strong>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {r.status === "pending" && (
                  <>
                    <button
                      onClick={() => approve(r.id)}
                      className="px-3 py-1 rounded bg-green-600 text-white"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reject(r.id)}
                      className="px-3 py-1 rounded bg-red-600 text-white"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <h1 className="text-2xl font-bold mt-10 mb-6">
        Admin — Project Weeks Review
      </h1>
      {loadingProjects ? (
        <div className="text-sm text-gray-400">Loading project weeks...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="space-y-8">
          {projectWeeks.map((user) => (
            <div key={user.uid} className="border rounded p-4">
              <div className="font-bold mb-2">User: {user.uid}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.weeks.map((week: ProjectWeekEntry) => (
                  <div key={week.week} className="border rounded p-2 mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">Week {week.week}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          week.status === "accepted"
                            ? "bg-green-100 text-green-700"
                            : week.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {week.status}
                      </span>
                    </div>
                    <div className="text-sm font-medium">{week.title}</div>
                    <div className="text-xs text-gray-500 mb-1">
                      {week.description}
                    </div>
                    <div className="text-xs">
                      <a
                        href={week.sourceCode}
                        className="text-blue-600 underline mr-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source
                      </a>
                      <a
                        href={week.demo}
                        className="text-blue-600 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Demo
                      </a>
                    </div>
                    <div className="text-xs mt-1">
                      Ack: {week.acknowledgments}
                    </div>
                    <div className="text-xs mt-1">Notes: {week.notes}</div>
                    {week.status !== "accepted" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          className="px-2 py-1 bg-green-500 text-white rounded"
                          onClick={() =>
                            handleAdminAction(user.uid, week.week, "accepted")
                          }
                        >
                          Accept
                        </button>
                        <button
                          className="px-2 py-1 bg-red-500 text-white rounded"
                          onClick={() =>
                            handleAdminAction(user.uid, week.week, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
