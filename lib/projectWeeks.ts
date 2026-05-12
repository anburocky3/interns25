import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { ProjectWeekEntry } from "@/components/ProjectUpdatesModal";

export async function getUserProjectWeeks(
  uid: string,
): Promise<ProjectWeekEntry[]> {
  const docRef = doc(db, "projectWeeks", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().weeks || [];
  }
  // Default: 25 empty weeks
  return Array.from({ length: 25 }, (_, i) => ({
    week: i + 1,
    title: "",
    description: "",
    sourceCode: "",
    demo: "",
    acknowledgments: "",
    notes: "",
    status: "pending",
  }));
}

export async function saveUserProjectWeeks(
  uid: string,
  weeks: ProjectWeekEntry[],
) {
  const docRef = doc(db, "projectWeeks", uid);
  await setDoc(docRef, { weeks }, { merge: true });
}

export async function getAllUsersProjectWeeks() {
  const colRef = collection(db, "projectWeeks");
  const snap = await getDocs(colRef);
  return snap.docs.map((doc) => ({ uid: doc.id, weeks: doc.data().weeks }));
}

export async function updateProjectWeekStatus(
  uid: string,
  week: number,
  status: "accepted" | "rejected",
) {
  const docRef = doc(db, "projectWeeks", uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;
  const weeks = docSnap.data().weeks || [];
  const updatedWeeks = weeks.map((w: ProjectWeekEntry) =>
    w.week === week ? { ...w, status } : w,
  );
  await updateDoc(docRef, { weeks: updatedWeeks });
}
