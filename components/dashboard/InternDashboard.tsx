"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import {
  formatIsoDate,
  startLabel,
  remainingDays as calcRemainingDays,
} from "@/lib/helpers";
import { doc, onSnapshot, deleteField, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import Head from "next/head";
import AudioUpload from "@/components/AudioUpload";
import Link from "next/link";
import { InternProfile } from "@/types";

type SocialLinks = {
  twitter?: string | null;
  linkedin?: string | null;
  github?: string | null;
  instagram?: string | null;
  tasks?: string | null;
  website?: string | null;
};

const DEFAULT_START_DATE = "2025-10-31";
const DEFAULT_END_DATE = "2026-04-30";

export default function InternDashboard() {
  const { user, loading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [leavesTaken, setLeavesTaken] = useState<number>(0);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [profile, setProfile] = useState<InternProfile>();
  const [social, setSocial] = useState<SocialLinks>({});
  const [audioIntroUrl, setAudioIntroUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as
        | ({ leavesTaken?: number; startDate?: string; endDate?: string } & {
            social?: SocialLinks;
          } & InternProfile)
        | undefined;
      setLeavesTaken(data?.leavesTaken ?? 0);
      setStartDate(data?.startDate ?? DEFAULT_START_DATE);
      setEndDate(data?.endDate ?? DEFAULT_END_DATE);
      setSocial(data?.social ?? {});
      setAudioIntroUrl(data?.audioIntroUrl ?? null);
      setProfile({
        uid: data?.uid ?? user.uid,
        name: data?.name ?? "",
        avatar: data?.avatar ?? "",
        position: data?.position ?? "",
        gender: data?.gender ?? undefined,
        social: data?.social ?? {},
        isStudent: data?.isStudent ?? false,
        hasWifi: data?.hasWifi ?? false,
        location: data?.location ?? undefined,
        email: data?.email ?? "",
        mobile: data?.mobile ?? undefined,
        audioIntroUrl: data?.audioIntroUrl ?? undefined,
      });
      setProfileLoading(false);
    });

    return () => unsub();
  }, [user]);

  // placeholder for potential leaves collection listener (kept intentionally minimal)
  useEffect(() => {
    if (!user) return;
    return () => {};
  }, [user]);

  const daysBetween = (fromIso: string | null, toIso: string | null) => {
    if (!fromIso || !toIso) return 0;
    try {
      const from = new Date(fromIso);
      const to = new Date(toIso);
      const ms = to.getTime() - from.getTime();
      return Math.ceil(ms / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const daysPassed = () => {
    const startIso = startDate ?? DEFAULT_START_DATE;
    const now = new Date();
    const start = new Date(startIso);
    const ms = now.getTime() - start.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  };

  const totalInternDays = () => {
    const s = startDate ?? DEFAULT_START_DATE;
    const e = endDate ?? DEFAULT_END_DATE;
    return daysBetween(s, e);
  };

  const daysRemaining = () => {
    const endIso = endDate ?? DEFAULT_END_DATE;
    const now = new Date();
    const end = new Date(endIso);
    const ms = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  const formattedStart = formatIsoDate(startDate, DEFAULT_START_DATE);
  const formattedEnd = formatIsoDate(endDate, DEFAULT_END_DATE);
  const startLabelText = startLabel(startDate, DEFAULT_START_DATE);
  const remainingDays = calcRemainingDays(endDate, DEFAULT_END_DATE);

  if (loading || profileLoading) {
    return (
      <div className="p-8">
        <div className="text-sm text-gray-300">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-red-400">
          You must be logged in to view the dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-8">
      <Head>
        <title>Intern Dashboard - CyberDude Interns Portal</title>
      </Head>
      <header className="flex justify-between items-center gap-6">
        <div className="flex items-center justify-center space-x-4">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-linear-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            {profile?.avatar ? (
              <Image
                src={profile.avatar}
                alt={profile.name ?? "avatar"}
                width={112}
                height={112}
                className="object-cover"
              />
            ) : (
              <div className="text-white font-bold text-2xl">
                {(profile?.name ?? "")
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-sky-300">
              {profile?.name ?? user.displayName ?? user.email}
            </h1>
            <div className="text-lg text-indigo-200">
              {profile?.gender ? `${profile.gender} • ` : ""}
              {profile?.position ?? "Intern"}
            </div>
            <div className="text-sm text-gray-300 mt-2">
              {profile?.location ?? "Location not set"}
            </div>
            {/* <div className="mt-2 text-sm text-sky-200">
              <a
                className="hover:underline"
                href={`mailto:${profile.email ?? user.email}`}
              >
                {profile.email ?? user.email}
              </a>
            </div>
            {profile.mobile && (
              <div className="mt-1 text-sm text-gray-300">{profile.mobile}</div>
            )} */}
            {/* <div className="mt-3 flex gap-3">
              {profile.isStudent && (
                <span className="px-3 py-1 rounded-full text-sm bg-green-600 text-white flex items-center">
                  <GraduationCap size={16} className="inline-block mr-1" />
                  <span>Student</span>
                </span>
              )}

              {profile.hasWifi && (
                <span className="px-3 py-1 rounded-full text-sm bg-blue-500 text-white flex items-center">
                  <Wifi size={16} className="inline-block mr-1" />
                  <span>Wifi</span>
                </span>
              )}
            </div> */}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href={`/interns/${profile?.slug ?? user.uid}`}
            className="px-3 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            View profile
          </Link>
          <Link
            href={`/profile/edit`}
            className="px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Edit profile
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-slate-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4">
              Internship Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-linear-to-br from-sky-800 to-indigo-900 rounded">
                <div className="text-sm text-sky-200">Leaves Taken</div>
                <div className="text-2xl font-bold text-white">
                  {leavesTaken}
                </div>
              </div>
              <div className="p-4 bg-linear-to-br from-emerald-800 to-emerald-900 rounded">
                <div className="text-sm text-emerald-200">Days Passed</div>
                <div className="text-2xl font-bold text-white">
                  {daysPassed()}
                </div>
              </div>
              <div className="p-4 bg-linear-to-br from-amber-700 to-amber-800 rounded">
                <div className="text-sm text-amber-100">Days Remaining</div>
                <div className="text-2xl font-bold text-white">
                  {daysRemaining()}
                </div>
              </div>
            </div>
          </div>

          <AudioUpload
            currentAudioUrl={audioIntroUrl ?? undefined}
            userName={profile?.name ?? user?.displayName ?? "user"}
            onUploadSuccess={(url) => {
              setAudioIntroUrl(url);
              const ref = doc(db, "users", user!.uid);
              setDoc(
                ref,
                { audioIntroUrl: url === undefined ? deleteField() : url },
                { merge: true },
              ).catch((err) => {
                console.error("Error saving audio URL:", err);
                toast.error("Failed to save audio URL");
              });
            }}
          />
        </div>

        <aside className="space-y-6">
          <div className=" rounded-xl shadow-lg bg-linear-to-br from-fuchsia-600 to-violet-700 text-white">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/12 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-white/90 uppercase tracking-wide">
                    Internship
                  </div>
                  <div className="font-semibold text-lg mt-1 flex flex-col items-center">
                    <span>{formattedStart}</span>{" "}
                    <ArrowLeft className="rotate-270" />{" "}
                    <span>{formattedEnd}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex flex-col items-end">
                  <div className="text-xs text-white/90">Remaining</div>
                  <div className="font-bold text-2xl">{remainingDays}</div>
                  <div className="text-xs text-white/80">days</div>
                </div>
              </div>
            </div>
            <div className="text-sm text-white/90 px-6">
              {startLabelText}. Keep these dates handy — they will show on the
              cohort calendar and attendance views.
            </div>
            <div className="mt-2 text-xs text-white/80 text-center p-4">
              Total: {totalInternDays()} days
            </div>
          </div>

          <Link
            href="/skills"
            className="p-6 rounded-xl shadow-lg bg-blue-500 hover:bg-blue-600 cursor-pointer backdrop-blur-md flex justify-between items-center text-white"
          >
            <h3 className="font-semibold">Test your Typing skills</h3>
            <ArrowRight className="" />
          </Link>

          <div className="p-6 rounded-xl shadow-lg bg-white/5 backdrop-blur-md border border-white/6">
            <h3 className="text-sm text-gray-300">Quick Links</h3>
            <ul className="mt-3 space-y-3">
              <li className="flex items-center gap-3">
                <a
                  className="flex items-center gap-2 text-sky-300 hover:underline"
                  href={social.linkedin ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v12H0zM7 8h4.8v1.7h.1c.7-1.2 2.4-2.5 4.9-2.5C22.3 7.2 24 9.7 24 14.1V20h-5v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H7V8z" />
                  </svg>
                  LinkedIn
                </a>
              </li>
              <li className="flex items-center gap-3">
                <a
                  className="flex items-center gap-2 text-sky-300 hover:underline"
                  href={social.github ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61C4.422 17.07 3.633 16.7 3.633 16.7c-1.087-.743.083-.728.083-.728 1.205.085 1.84 1.238 1.84 1.238 1.07 1.834 2.807 1.304 3.492.998.108-.776.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.007-.322 3.3 1.23.957-.266 1.984-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.29-1.552 3.295-1.23 3.295-1.23.653 1.653.24 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.624-5.48 5.92.43.37.815 1.096.815 2.21 0 1.596-.014 2.883-.014 3.275 0 .32.216.694.825.576C20.565 21.796 24 17.296 24 12c0-6.63-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </li>
              <li className="flex items-center gap-3">
                <a
                  className="flex items-center gap-2 text-sky-300 hover:underline"
                  href={social.website ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 17.93V19a6.9 6.9 0 01-2 0v.93A8 8 0 014.07 13H5a6.9 6.9 0 010-2H4.07A8 8 0 0111 4.07V5a6.9 6.9 0 012 0V4.07A8 8 0 0119.93 11H19a6.9 6.9 0 010 2h.93A8 8 0 0113 19.93z" />
                  </svg>
                  Website
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
