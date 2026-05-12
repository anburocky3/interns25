import { doc, getDoc, setDoc, query, where, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { InternProfile, WeeklyTaskEntry } from "@/types";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type ProfileUpdateInput = Partial<Omit<InternProfile, "uid">>;

export async function fetchInternProfile(
  uid: string,
): Promise<InternProfile | null> {
  if (!uid) return null;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as InternProfile;
}

export async function fetchInternProfileBySlug(
  slug: string,
): Promise<InternProfile | null> {
  if (!slug) return null;
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("slug", "==", slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as InternProfile;
}

export function normalizeWeeklyTasks(
  tasks: WeeklyTaskEntry[],
): WeeklyTaskEntry[] {
  const now = new Date().toISOString();
  return tasks.map((task, idx) => {
    const items = (task.items ?? []).filter((item) => item && item.trim());
    return {
      week: Number.isFinite(task.week) ? task.week : idx + 1,
      title: task.title?.trim() || undefined,
      status: task.status ?? "in-progress",
      notes: task.notes?.trim() || undefined,
      link: task.link?.trim() || undefined,
      items,
      updatedAt: task.updatedAt ?? now,
    } satisfies WeeklyTaskEntry;
  });
}

export async function saveInternProfile(
  uid: string,
  data: ProfileUpdateInput,
): Promise<void> {
  if (!uid) throw new Error("Missing uid for profile update");
  const ref = doc(db, "users", uid);
  const slug = data.name ? generateSlug(data.name) : undefined;
  await setDoc(
    ref,
    {
      ...data,
      ...(slug && { slug }),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function saveWeeklyTasks(
  uid: string,
  tasks: WeeklyTaskEntry[],
): Promise<void> {
  const normalized = normalizeWeeklyTasks(tasks);
  await saveInternProfile(uid, { weeklyTasks: normalized });
}
