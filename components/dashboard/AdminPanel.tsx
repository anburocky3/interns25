"use client";
import React, { useEffect, useState } from "react";
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
    </div>
  );
}
