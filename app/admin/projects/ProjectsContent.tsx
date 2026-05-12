"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getAllInternProfiles } from "@/lib/internProfiles";
import { doc, updateDoc } from "firebase/firestore";
import { InternProfile } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllUsersProjectWeeks } from "@/lib/projectWeeks";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import type { ProjectWeekEntry } from "@/components/ProjectUpdatesModal";

interface UserProjectWeeks {
  uid: string;
  weeks: ProjectWeekEntry[];
}

export function ProjectsContent() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allProjects, setAllProjects] = useState<UserProjectWeeks[]>([]);
  const [projects, setProjects] = useState<UserProjectWeeks[]>([]);
  const [profiles, setProfiles] = useState<Record<string, InternProfile>>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{
    userId: string;
    weekNum: number;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      setLoadingProjects(true);
      getAllUsersProjectWeeks()
        .then((data) => {
          setAllProjects(data);
          setProjects(data);
        })
        .catch(() => setError("Failed to load projects."))
        .finally(() => setLoadingProjects(false));
      getAllInternProfiles().then((arr) => {
        const map: Record<string, InternProfile> = {};
        arr.forEach((p) => (map[p.uid] = p));
        setProfiles(map);
      });
    }
  }, [user, isAdmin]);

  // Filter by uid if present in query
  useEffect(() => {
    const uid = searchParams?.get("uid");
    if (uid && allProjects.length > 0) {
      setProjects(allProjects.filter((p) => p.uid === uid));
    } else {
      setProjects(allProjects);
    }
  }, [searchParams, allProjects]);

  // Admin accept/reject handler for week
  async function handleWeekStatus(
    userId: string,
    weekNum: number,
    newStatus: "accepted" | "rejected",
    reason?: string,
  ) {
    setUpdating(`${userId}-${weekNum}`);
    try {
      // Find the user in projects
      const userIdx = projects.findIndex((u) => u.uid === userId);
      if (userIdx === -1) return;
      const user = projects[userIdx];
      const weeks = user.weeks.map((w: ProjectWeekEntry) =>
        w.week === weekNum
          ? {
              ...w,
              status: newStatus,
              ...(newStatus === "rejected" && reason
                ? { rejectionReason: reason }
                : {}),
            }
          : w,
      );
      // Update Firestore (projectWeeks collection)
      const userRef = doc(db, "projectWeeks", userId);
      await updateDoc(userRef, { weeks });
      // Update local state
      setProjects((prev) => {
        const copy = [...prev];
        copy[userIdx] = { ...user, weeks };
        return copy;
      });
      setRejectionModal(null);
      setRejectionReason("");
    } catch {
      setError("Failed to update week status");
    } finally {
      setUpdating(null);
    }
  }

  const handleRejectWithReason = async () => {
    if (!rejectionModal) return;
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }
    await handleWeekStatus(
      rejectionModal.userId,
      rejectionModal.weekNum,
      "rejected",
      rejectionReason.trim(),
    );
  };

  if (loading || loadingProjects)
    return <div className="p-8 text-gray-400">Loading...</div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-sky-700 dark:text-sky-200 flex items-center gap-3">
        <ArrowLeft
          className="cursor-pointer"
          onClick={() => router.push("/admin/dashboard")}
        />
        Intern Projects
        {searchParams?.get("uid")
          ? " - " +
            (profiles[searchParams.get("uid")!]?.name ||
              searchParams.get("uid"))
          : ""}
      </h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="space-y-8">
        {projects.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 italic py-8">
            No project submissions found.
          </div>
        )}
        {projects.map((user) => {
          const profile = profiles[user.uid];
          return (
            <div
              key={user.uid}
              className="border rounded-2xl p-6 dark:border-neutral-800 bg-linear-to-br from-sky-50 to-blue-100 dark:from-sky-900 dark:to-blue-950 shadow-lg mb-8"
            >
              <div className="flex items-center gap-4 mb-4">
                {profile?.social?.github ? (
                  <Image
                    src={`https://github.com/${profile.social.github}.png`}
                    alt={profile.name || user.uid}
                    width={56}
                    height={56}
                    className="rounded-full border shadow"
                  />
                ) : profile?.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name || user.uid}
                    width={56}
                    height={56}
                    className="rounded-full border shadow"
                  />
                ) : (
                  <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-200 dark:bg-neutral-800 border shadow">
                    <svg
                      className="w-7 h-7 text-gray-400"
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
                  <div className="font-bold text-xl text-sky-800 dark:text-sky-200">
                    {profile?.name || user.uid}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {profile?.position || "—"}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {profile?.email}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.weeks && user.weeks.length > 0 ? (
                  user.weeks.map((week) => (
                    <div
                      key={week.week}
                      className="border rounded-xl p-4 mb-2 bg-white dark:bg-neutral-900 dark:border-neutral-700 shadow flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-base">
                          Week {week.week}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded font-bold transition-colors duration-200 ${
                            week.status === "accepted"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                              : week.status === "rejected"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {week.status}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-sky-900 dark:text-sky-100">
                        {week.title}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        {week.description}
                      </div>
                      <div className="text-xs">
                        {week.sourceCode && (
                          <a
                            href={week.sourceCode}
                            className="text-blue-600 underline mr-2"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Source
                          </a>
                        )}
                        {week.demo && (
                          <a
                            href={week.demo}
                            className="text-blue-600 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Demo
                          </a>
                        )}
                      </div>
                      <div className="text-xs mt-1">
                        Ack: {week.acknowledgments}
                      </div>
                      <div className="text-xs mt-1">Notes: {week.notes}</div>
                      {week.status === "rejected" &&
                        (week as unknown as { rejectionReason?: string })
                          ?.rejectionReason && (
                          <div className="text-xs mt-1 text-red-500">
                            Reason:{" "}
                            {
                              (week as unknown as { rejectionReason?: string })
                                .rejectionReason
                            }
                          </div>
                        )}
                      <div className="flex gap-2 mt-2">
                        <button
                          className="px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-60"
                          disabled={
                            updating === `${user.uid}-${week.week}` ||
                            week.status === "accepted"
                          }
                          onClick={() =>
                            handleWeekStatus(user.uid, week.week, "accepted")
                          }
                        >
                          Accept
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60"
                          disabled={
                            updating === `${user.uid}-${week.week}` ||
                            week.status === "rejected"
                          }
                          onClick={() =>
                            setRejectionModal({
                              userId: user.uid,
                              weekNum: week.week,
                            })
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-400 dark:text-gray-500 italic py-8">
                    No week projects have been updated by this intern.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejection Reason Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Reject Project Submission
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for rejecting this submission:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setError(null);
              }}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
            />
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setRejectionModal(null);
                  setRejectionReason("");
                  setError(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectWithReason}
                disabled={
                  updating ===
                  `${rejectionModal.userId}-${rejectionModal.weekNum}`
                }
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {updating ===
                `${rejectionModal.userId}-${rejectionModal.weekNum}`
                  ? "Submitting..."
                  : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
