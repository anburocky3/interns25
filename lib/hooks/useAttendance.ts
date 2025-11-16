"use client";
import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  orderBy,
  serverTimestamp,
  type FirestoreError,
  type Query,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function todayString(date?: Date) {
  const d = date ? new Date(date) : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useAttendance(opts?: {
  userId?: string;
  date?: string;
  admin?: boolean;
}) {
  type AttendanceRecord = {
    id: string;
    userId: string;
    date: string;
    status?: string;
    checkInTime?: Timestamp | null;
  };

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    const dateStr = opts?.date ?? todayString();
    const col = collection(db, "attendance");
    let q: Query<DocumentData> | null = null;
    if (opts?.admin) {
      q = query(
        col,
        where("date", "==", dateStr),
        orderBy("checkInTime", "desc")
      );
    } else if (opts?.userId) {
      q = query(
        col,
        where("date", "==", dateStr),
        where("userId", "==", opts.userId)
      );
    } else {
      // nothing to listen to — defer state updates to avoid synchronous setState in effect
      Promise.resolve().then(() => {
        setRecords([]);
        setLoading(false);
      });
      return;
    }

    const unsub = onSnapshot(
      q as Query<DocumentData>,
      (snap) => {
        const items: AttendanceRecord[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          items.push({
            id: doc.id,
            userId: String(d.userId ?? ""),
            date: String(d.date ?? ""),
            status: d.status as string | undefined,
            checkInTime: (d.checkInTime as Timestamp) ?? null,
          });
        });
        setRecords(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [opts?.userId, opts?.date, opts?.admin]);

  const checkIn = useCallback(async (userId: string, date?: string) => {
    const dateStr = date ?? todayString();
    await addDoc(collection(db, "attendance"), {
      userId,
      date: dateStr,
      status: "present",
      checkInTime: serverTimestamp(),
    });
  }, []);

  return { records, loading, error, checkIn };
}
