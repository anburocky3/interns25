import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { InternProfile } from "@/types";

export async function getAllInternProfiles(): Promise<InternProfile[]> {
  const colRef = collection(db, "users");
  const snap = await getDocs(colRef);
  return snap.docs.map((doc) => doc.data() as InternProfile);
}
