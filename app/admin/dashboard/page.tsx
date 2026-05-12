"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllUsersProjectWeeks } from "@/lib/projectWeeks";
import { getAllInternProfiles } from "@/lib/internProfiles";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { InternProfile } from "@/types";
import Image from "next/image";
import { githubAvatarFromUrl } from "@/lib/helpers";

export default function AdminDashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [projectCount, setProjectCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [interns, setInterns] = useState<InternProfile[]>([]);
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterExpired, setFilterExpired] = useState<string>("active");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    async function fetchStats() {
      // Total projects: count all project week entries (across all users)
      const allProjects = await getAllUsersProjectWeeks();
      let totalProjects = 0;
      allProjects.forEach((u) => {
        totalProjects += (u.weeks || []).length;
      });
      setProjectCount(totalProjects);
      // Total leaves: count all leave docs
      const leavesSnap = await getDocs(collection(db, "leaves"));
      setLeaveCount(leavesSnap.size);
      // All interns
      const internList = await getAllInternProfiles();
      setInterns(internList);
    }
    if (user && isAdmin) fetchStats();
  }, [user, isAdmin]);

  // Filtered interns
  const filteredInterns = useMemo(() => {
    const filtered = interns.filter((intern) => {
      // Status filter
      if (filterStatus !== "all") {
        if (filterStatus === "active" && !intern.active) return false;
        if (filterStatus === "inactive" && intern.active) return false;
      }
      // Student filter
      if (filterStudent !== "all") {
        if (filterStudent === "student" && !intern.isStudent) return false;
        if (filterStudent === "non-student" && intern.isStudent) return false;
      }
      // Location filter
      if (filterLocation !== "all" && intern.location !== filterLocation)
        return false;
      // Expired filter (active=false or status=false)
      if (
        filterExpired === "expired" &&
        intern.active !== false &&
        intern.status !== false
      )
        return false;
      if (filterExpired === "active") return true;
      return true;
    });
    return filtered.sort((a, b) => {
      const nameCompare = (a.name ?? "").localeCompare(
        b.name ?? "",
        undefined,
        {
          sensitivity: "base",
        },
      );
      if (nameCompare !== 0) return nameCompare;

      const aActive = a.active !== false;
      const bActive = b.active !== false;
      if (aActive !== bActive) return aActive ? -1 : 1;

      const aStatus = a.status !== false;
      const bStatus = b.status !== false;
      if (aStatus !== bStatus) return aStatus ? -1 : 1;

      return 0;
    });
  }, [interns, filterStatus, filterStudent, filterLocation, filterExpired]);

  // Unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locs = interns.map((i) => i.location).filter(Boolean);
    return Array.from(new Set(locs));
  }, [interns]);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-linear-to-br from-sky-100 to-sky-300 dark:from-sky-900 dark:to-sky-700 rounded-xl shadow-lg p-8 flex flex-col items-center">
          <span className="text-5xl font-extrabold text-sky-700 dark:text-sky-200">
            {projectCount}
          </span>
          <span className="text-gray-700 dark:text-gray-200 mt-2 font-medium">
            Total Project Weeks
          </span>
        </div>
        <div className="bg-linear-to-br from-pink-100 to-pink-300 dark:from-pink-900 dark:to-pink-700 rounded-xl shadow-lg p-8 flex flex-col items-center">
          <span className="text-5xl font-extrabold text-pink-700 dark:text-pink-200">
            {leaveCount}
          </span>
          <span className="text-gray-700 dark:text-gray-200 mt-2 font-medium">
            Total Leaves
          </span>
        </div>
        <div className="bg-linear-to-br from-emerald-100 to-emerald-300 dark:from-emerald-900 dark:to-emerald-700 rounded-xl shadow-lg p-8 flex flex-col items-center">
          <span className="text-5xl font-extrabold text-emerald-700 dark:text-emerald-200">
            {interns.length}
          </span>
          <span className="text-gray-700 dark:text-gray-200 mt-2 font-medium">
            Internship Candidates
          </span>
        </div>
      </div>
      <div className="mb-6 flex flex-wrap gap-4 items-center bg-white dark:bg-neutral-900 p-4 rounded-lg shadow">
        <div>
          <label className="block text-xs font-semibold mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded border px-2 py-1"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Student</label>
          <select
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            className="rounded border px-2 py-1"
          >
            <option value="all">All</option>
            <option value="student">Student</option>
            <option value="non-student">Non-student</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Location</label>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="rounded border px-2 py-1"
          >
            <option value="all">All</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Expired</label>
          <select
            value={filterExpired}
            onChange={(e) => setFilterExpired(e.target.value)}
            className="rounded border px-2 py-1"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white dark:bg-neutral-900">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">
                Location
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">
                Student
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">
                Expired
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredInterns.map((intern) => {
              const isExpired =
                intern.active === false || intern.status === false;

              let completed6 = false;
              if (intern.updatedAt) {
                const endDate = new Date(intern.updatedAt);
                const now = new Date();
                const diff =
                  (now.getTime() - endDate.getTime()) /
                  (1000 * 60 * 60 * 24 * 30.44);
                completed6 = diff >= 6;
              }

              const profileHref = `/interns/${intern.slug || intern.uid}`;

              return (
                <tr
                  key={intern.uid}
                  className="border-b border-gray-100 dark:border-neutral-800 hover:bg-sky-50 dark:hover:bg-neutral-800 transition-all"
                >
                  <td className="px-4 py-2 whitespace-nowrap font-semibold">
                    <div className="flex items-center">
                      <Image
                        src={
                          githubAvatarFromUrl(intern.social?.github) ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(intern.name)}&background=random&size=128`
                        }
                        alt={intern.name ?? ""}
                        width={0}
                        height={0}
                        className="w-12 h-12 rounded-full object-cover mr-3 inline-block"
                        unoptimized
                        loading="eager"
                      />
                      <div>
                        <Link
                          href={profileHref}
                          className="text-sky-700 dark:text-sky-300 hover:underline cursor-pointer"
                        >
                          {intern.name}
                        </Link>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {intern.email}
                        </div>
                        <div>
                          <span className="text-xs font-medium mr-2">
                            {intern.position ? intern.position : "-"}
                          </span>
                          {intern.moderator && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                              Moderator
                            </span>
                          )}
                          {intern.role === "admin" && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {intern.location ?? "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {intern.isStudent ? (
                      <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        Student
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs rounded bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {isExpired ? (
                      <span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                        Expired
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={profileHref}
                        className="inline-flex items-center px-3 py-1.5 text-xs rounded-md bg-sky-600 text-white hover:bg-sky-500"
                      >
                        Public profile
                      </Link>
                      <Link
                        href={`/admin/projects?uid=${intern.uid}`}
                        className="inline-flex items-center px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
                      >
                        Project submissions
                      </Link>
                      <Link
                        href={`${profileHref}/edit`}
                        className="inline-flex items-center px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
