"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchInternProfileBySlug } from "@/lib/internProfile";
import { githubAvatarFromUrl, formatIsoDate } from "@/lib/helpers";
import { InternProfile, WeeklyTaskEntry } from "@/types";
import {
  ExternalLink,
  Github,
  Linkedin,
  Loader2,
  MapPin,
  NotebookPen,
  Phone,
  UserRound,
} from "lucide-react";

export default function InternDetailPage() {
  const params = useParams<{ uid: string; slug?: string }>();
  const router = useRouter();
  const { user, role } = useAuth();
  const slug = params?.slug ?? params?.uid;
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchInternProfileBySlug(slug)
      .then((data) => {
        if (!data) {
          setError("Profile not found");
          return;
        }
        setProfile(data);
      })
      .catch((err) => {
        console.error("Failed to load intern profile", err);
        setError("Could not load this profile");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const canEdit = useMemo(
    () =>
      Boolean(
        user && profile && (user.uid === profile.uid || role === "admin"),
      ),
    [role, profile, user],
  );

  const tasks = useMemo<WeeklyTaskEntry[]>(() => {
    if (!profile?.weeklyTasks) return [];
    return [...profile.weeklyTasks].sort(
      (a, b) => (a.week ?? 0) - (b.week ?? 0),
    );
  }, [profile?.weeklyTasks]);

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-gray-200">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8">
        <div className="text-rose-400 text-sm">
          {error ?? "Profile missing"}
        </div>
        <button
          className="mt-4 text-sm text-blue-300 hover:underline"
          onClick={() => router.back()}
        >
          Go back
        </button>
      </div>
    );
  }

  const avatarSrc =
    profile.avatar ||
    githubAvatarFromUrl(profile.social?.github) ||
    "/default-avatar.png";

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-start gap-6">
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-800 border border-white/10">
          <Image
            src={avatarSrc}
            alt={profile.name ?? "avatar"}
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
            {profile.position && (
              <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-gray-100">
                {profile.position}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-300 text-sm">
            {profile.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {profile.location}
              </span>
            )}
            {profile.email && (
              <a
                className="inline-flex items-center gap-2 hover:text-white"
                href={`mailto:${profile.email}`}
              >
                <UserRound className="w-4 h-4" /> {profile.email}
              </a>
            )}
            {profile.mobile && (
              <a
                className="inline-flex items-center gap-2 hover:text-white"
                href={`tel:${profile.mobile}`}
              >
                <Phone className="w-4 h-4" /> {profile.mobile}
              </a>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {profile.social?.linkedin && (
              <a
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/20 text-blue-200 hover:bg-blue-600/30"
                href={profile.social.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                <Linkedin className="w-4 h-4" /> LinkedIn
              </a>
            )}
            {profile.social?.github && (
              <a
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/60 text-white hover:bg-slate-700"
                href={profile.social.github}
                target="_blank"
                rel="noreferrer"
              >
                <Github className="w-4 h-4" /> GitHub
              </a>
            )}
            {profile.social?.website && (
              <a
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600/30"
                href={profile.social.website}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="w-4 h-4" /> Website
              </a>
            )}
            {profile.social?.tasks && (
              <a
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-600/20 text-amber-100 hover:bg-amber-600/30"
                href={profile.social.tasks}
                target="_blank"
                rel="noreferrer"
              >
                <NotebookPen className="w-4 h-4" /> Task tracker
              </a>
            )}
          </div>

          {canEdit && (
            <div className="mt-4">
              <Link
                href={`/interns/${profile.slug}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
              >
                Edit profile
              </Link>
            </div>
          )}
        </div>
      </div>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Weekly Tasks</h2>
            <p className="text-sm text-gray-400">
              Progress snapshots for each week of the internship.
            </p>
          </div>
          {profile.updatedAt && (
            <div className="text-xs text-gray-400">
              Updated {formatIsoDate(profile.updatedAt)}
            </div>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="text-sm text-gray-400">No tasks added yet.</div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const pillColor =
                task.status === "done"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : task.status === "planned"
                    ? "bg-slate-500/20 text-slate-200"
                    : "bg-amber-500/20 text-amber-100";
              return (
                <div
                  key={`${task.week}-${task.title ?? "task"}`}
                  className="p-4 rounded-xl border border-white/5 bg-slate-900/60"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <span className="px-2 py-1 rounded-lg bg-white/10 text-sm">
                        Week {task.week}
                      </span>
                      {task.title && <span>{task.title}</span>}
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs ${pillColor}`}
                    >
                      {task.status ?? "in-progress"}
                    </div>
                  </div>
                  {task.notes && (
                    <p className="text-sm text-gray-300 mt-2">{task.notes}</p>
                  )}
                  <ul className="mt-3 space-y-1 text-sm text-gray-200 list-disc list-inside">
                    {(task.items ?? []).length > 0 ? (
                      task.items!.map((item) => <li key={item}>{item}</li>)
                    ) : (
                      <li className="text-gray-500">No items recorded</li>
                    )}
                  </ul>
                  {task.link && (
                    <a
                      href={task.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm text-sky-300 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" /> Resources
                    </a>
                  )}
                  {task.updatedAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Updated {formatIsoDate(task.updatedAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
