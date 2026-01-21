import { InternProfile } from "@/types";
import { db } from "./firebase";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";

let cache: { ts: number; data: InternProfile[] } | null = null;
const DEFAULT_TTL = 60; // seconds

// Position groups for easier filtering
const POSITION_GROUPS: Record<string, string[]> = {
  dev: ["Fullstack Engineer Intern", "UI/UX Engineer Intern"],
};

export async function getCachedUsers(
  positions?: string | string[],
  ttl = DEFAULT_TTL,
) {
  // Normalize positions to array and expand groups
  const expandedPositions: string[] = [];

  if (positions) {
    const posArray = Array.isArray(positions) ? positions : [positions];
    for (const pos of posArray) {
      if (POSITION_GROUPS[pos]) {
        expandedPositions.push(...POSITION_GROUPS[pos]);
      } else {
        expandedPositions.push(pos);
      }
    }
  }

  if (cache && Date.now() - cache.ts < ttl * 1000) {
    // If positions specified, filter cached data
    if (expandedPositions.length > 0) {
      return cache.data.filter((user) =>
        expandedPositions.includes(user.position || ""),
      );
    }
    return cache.data;
  }

  let q;
  if (expandedPositions.length > 0) {
    // Query for specific positions
    q = query(
      collection(db, "users"),
      where("role", "==", "intern"),
      where("position", "in", expandedPositions),
      orderBy("name", "asc"),
    );
  } else {
    // Query for all interns
    q = query(
      collection(db, "users"),
      where("role", "==", "intern"),
      orderBy("name", "asc"),
    );
  }

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
