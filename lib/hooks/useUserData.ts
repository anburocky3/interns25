"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Intern } from "@/data/internsData";

export function useUserData(userId?: string) {
  const [data, setData] = useState<Intern[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      // Defer clearing state to avoid synchronous setState inside effect.
      Promise.resolve().then(() => {
        setData(null);
        setLoading(false);
      });
      return;
    }

    const ref = doc(db, "users", userId);
    const unsub = onSnapshot(ref, (snap) => {
      // onSnapshot may invoke the listener synchronously during subscription.
      // Defer state updates to the microtask queue to avoid React's
      // "calling setState synchronously within an effect" warning and
      // reduce the risk of cascading renders.
      Promise.resolve().then(() => {
        setData(snap.exists() ? (snap.data() as Intern[]) : null);
        setLoading(false);
      });
    });

    return () => unsub();
  }, [userId]);

  return { user: data, loading };
}
