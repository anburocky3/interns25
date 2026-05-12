"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getAllInternProfiles } from "@/lib/internProfiles";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { InternProfile } from "@/types";
import { ArrowLeft } from "lucide-react";
import { githubAvatarFromUrl } from "@/lib/helpers";

interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: Timestamp; // Firestore timestamp
}

export default function AdminLeavesPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, InternProfile>>({});
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingLeaves, setLoadingLeaves] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [user, isAdmin, loading, router]);

  // Fetch all intern profiles for mapping userId to profile
  useEffect(() => {
    if (user && isAdmin) {
      getAllInternProfiles().then((arr) => {
        const map: Record<string, InternProfile> = {};
        arr.forEach((p) => (map[p.uid] = p));
        setProfiles(map);
      });
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (user && isAdmin) {
      setLoadingLeaves(true);
      const fetchLeaves = async () => {
        try {
          const leavesRef = collection(db, "leaves");
          const q = query(leavesRef, orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          setLeaves(
            snap.docs.map((d) => ({ id: d.id, ...d.data() })) as LeaveRequest[],
          );
        } catch {
          setError("Failed to load leaves.");
        } finally {
          setLoadingLeaves(false);
        }
      };
      fetchLeaves();
    }
  }, [user, isAdmin]);

  if (loading || loadingLeaves)
    return <div className="p-8 text-gray-400">Loading...</div>;
  if (!user || !isAdmin) return null;

  // Admin status update handler
  async function handleStatusChange(
    leaveId: string,
    newStatus: "approved" | "rejected" | "pending",
  ) {
    setUpdating(leaveId);
    try {
      const leaveRef = doc(db, "leaves", leaveId);
      await updateDoc(leaveRef, { status: newStatus });
      setLeaves((prev) =>
        prev.map((l) => (l.id === leaveId ? { ...l, status: newStatus } : l)),
      );
    } catch {
      setError("Failed to update status");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-sky-700 dark:text-sky-200 flex items-center gap-3">
        <ArrowLeft
          className="cursor-pointer"
          onClick={() => router.push("/admin/dashboard")}
        />
        Intern Leaves
      </h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="space-y-6">
        {leaves.map((leave) => {
          const profile = profiles[leave.userId];
          return (
            <div
              key={leave.id}
              className="flex flex-col md:flex-row items-center md:items-start gap-6 border rounded-xl p-6 bg-white dark:bg-neutral-900 shadow-md dark:border-neutral-800"
            >
              <div className="flex items-center gap-4 w-full md:w-1/3">
                {profile?.social?.github ? (
                  <Image
                    src={githubAvatarFromUrl(profile.social.github) || ""}
                    alt={profile.name || leave.userId}
                    width={64}
                    height={64}
                    className="rounded-full border shadow"
                    unoptimized
                  />
                ) : profile?.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name || leave.userId}
                    width={64}
                    height={64}
                    className="rounded-full border shadow"
                  />
                ) : (
                  <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 dark:bg-neutral-800 border shadow">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                      />
                    </svg>
                  </span>
                )}
                <div>
                  <div className="font-bold text-lg text-sky-800 dark:text-sky-200">
                    {profile?.name || leave.userId}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {profile?.position || "—"}
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-wrap gap-4 mb-2 text-sm text-gray-600 dark:text-gray-300">
                  <span>
                    <strong>From:</strong> {leave.startDate}
                  </span>
                  <span>
                    <strong>To:</strong> {leave.endDate}
                  </span>
                </div>
                <div className="mb-2 text-base font-medium">
                  {leave.reason ?? "—"}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs">Status:</span>
                  <select
                    value={leave.status}
                    disabled={updating === leave.id}
                    onChange={(e) =>
                      handleStatusChange(
                        leave.id,
                        e.target.value as "pending" | "approved" | "rejected",
                      )
                    }
                    className="rounded border px-2 py-1 text-sm font-semibold bg-gray-100 dark:bg-neutral-800"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {leave.status === "rejected" && leave.rejectionReason && (
                    <span className="text-xs text-red-500 ml-2">
                      Reason: {leave.rejectionReason}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
