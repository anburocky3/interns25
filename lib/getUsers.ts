import { InternProfile } from "@/types";
import { db } from "./firebase";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";

let cache: { ts: number; data: InternProfile[] } | null = null;
const DEFAULT_TTL = 60; // seconds

export async function getCachedUsers(ttl = DEFAULT_TTL) {
  if (cache && Date.now() - cache.ts < ttl * 1000) {
    return cache.data;
  }

  const q = query(
    collection(db, "users"),
    where("role", "==", "intern"),
    orderBy("name", "asc")
  );
  const snap = await getDocs(q);

  // Include users that either don't have `active` set or have it set to `true`.
  // Exclude users where `active` is explicitly `false`.
  const users: InternProfile[] = snap.docs
    .map((d) => d.data() as InternProfile & { active?: boolean })
    .filter((u) => u.active !== false)
    .map((u) => ({ ...(u as InternProfile) }));
  cache = { ts: Date.now(), data: users };
  return users;
}

export default getCachedUsers;
