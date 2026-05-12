"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  fetchInternProfileBySlug,
  normalizeWeeklyTasks,
  saveInternProfile,
} from "@/lib/internProfile";
import { WeeklyTaskEntry } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";

export default function InternEditPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();
  const { user, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [hasWifi, setHasWifi] = useState(false);

  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tasksLink, setTasksLink] = useState("");

  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTaskEntry[]>([]);

  const canEdit = useMemo(
    () =>
      Boolean(
        user && profile && (user.uid === profile.uid || role === "admin"),
      ),
    [role, profile, user],
  );

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
        setName(data.name ?? "");
        setPosition(data.position ?? "");
        setLocation(data.location ?? "");
        setMobile(data.mobile ?? "");
        setGender(data.gender ?? "");
        setIsStudent(Boolean(data.isStudent));
        setHasWifi(Boolean(data.hasWifi));

        setLinkedin(data.social?.linkedin ?? "");
        setGithub(data.social?.github ?? "");
        setWebsite(data.social?.website ?? "");
        setInstagram(data.social?.instagram ?? "");
        setTasksLink(data.social?.tasks ?? "");

        setWeeklyTasks(data.weeklyTasks ?? []);
      })
      .catch((err) => {
        console.error("Failed to load intern for editing", err);
        setError("Could not load this profile");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const updateTask = (index: number, update: Partial<WeeklyTaskEntry>) => {
    setWeeklyTasks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...update } as WeeklyTaskEntry;
      return next;
    });
  };

  const updateTaskItems = (index: number, text: string) => {
    const items = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    updateTask(index, { items });
  };

  const addWeek = () => {
    setWeeklyTasks((prev) => [
      ...prev,
      {
        week: prev.length + 1,
        title: "",
        items: [],
        status: "in-progress",
        notes: "",
        link: "",
      },
    ]);
  };

  const removeWeek = (index: number) => {
    setWeeklyTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!profile?.uid) return;
    if (!canEdit) {
      setError("You are not allowed to edit this profile");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const normalizedTasks = normalizeWeeklyTasks(weeklyTasks);
      await saveInternProfile(profile.uid, {
        name: name.trim() || "",
        position: position.trim() || "",
        location: location.trim() || "",
        mobile: mobile.trim() || "",
        gender: (gender as "O" | "M" | "F") || "O",
        isStudent,
        hasWifi,
        social: {
          linkedin: linkedin.trim() || undefined,
          github: github.trim() || undefined,
          website: website.trim() || undefined,
          instagram: instagram.trim() || undefined,
          tasks: tasksLink.trim() || undefined,
        },
        weeklyTasks: normalizedTasks,
      });
      toast.success("Profile updated");
      router.push(`/interns/${profile.slug}`);
    } catch (err) {
      console.error("Failed to save profile", err);
      setError("Saving failed. Please try again.");
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-200 text-sm">Preparing editor...</div>;
  }

  if (!canEdit) {
    return (
      <div className="p-8 text-rose-400 text-sm">
        You are not allowed to edit this profile.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Edit profile</h1>
          <p className="text-sm text-gray-400">
            Update your basic info, links, and weekly tasks.
          </p>
        </div>
        <Link
          href={`/interns/${profile?.slug}`}
          className="text-sm text-blue-300 hover:underline\"
        >
          View profile
        </Link>
      </div>

      {error && <div className="text-sm text-rose-400">{error}</div>}

      <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Basic info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1 text-sm text-gray-300">
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
              placeholder="Your name"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-300">
            <span>Position</span>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
              placeholder="Fullstack Engineer Intern"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-300">
            <span>Location</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
              placeholder="City, Country"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-300">
            <span>Mobile</span>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
              placeholder="+91 9876543211"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-300">
            <span>Gender</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
            >
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </label>
          <div className="flex items-center gap-6 text-sm text-gray-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isStudent}
                onChange={(e) => setIsStudent(e.target.checked)}
              />
              <span>Student</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasWifi}
                onChange={(e) => setHasWifi(e.target.checked)}
              />
              <span>Has Wi-Fi</span>
            </label>
          </div>
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1 text-sm text-gray-300">
            <span>LinkedIn</span>
            <input
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
              placeholder="https://linkedin.com/in/username"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-300">
            <span>GitHub</span>
            <input
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
              placeholder="https://github.com/username"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-300">
            <span>Website</span>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
              placeholder="https://yourwebsite.com"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-300">
            <span>Instagram</span>
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
              placeholder="https://instagram.com/username"
            />
          </label>
          <label className="md:col-span-2 space-y-1 text-sm text-gray-300">
            <span>Tasks / tracker link</span>
            <input
              value={tasksLink}
              onChange={(e) => setTasksLink(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
              placeholder="Notion, Google Doc, etc."
            />
          </label>
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Weekly tasks</h2>
            <p className="text-sm text-gray-400">
              Track what you shipped each week.
            </p>
          </div>
          <button
            onClick={addWeek}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Add week
          </button>
        </div>

        {weeklyTasks.length === 0 && (
          <div className="text-sm text-gray-400">
            No weeks yet. Add the first week to start tracking.
          </div>
        )}

        <div className="space-y-4">
          {weeklyTasks.map((task, index) => (
            <div
              key={`${task.week}-${index}`}
              className="p-4 rounded-xl border border-white/10 bg-slate-900/70 space-y-3"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <span>Week</span>
                  <input
                    type="number"
                    value={task.week ?? index + 1}
                    onChange={(e) =>
                      updateTask(index, { week: Number(e.target.value) })
                    }
                    className="w-20 rounded px-2 py-1 bg-slate-800/70 border border-white/10 text-white"
                  />
                </label>
                <label className="flex-1 text-sm text-gray-300">
                  <span className="block">Title</span>
                  <input
                    value={task.title ?? ""}
                    onChange={(e) =>
                      updateTask(index, { title: e.target.value })
                    }
                    className="w-full rounded px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
                    placeholder="What did you focus on?"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  <span className="block">Status</span>
                  <select
                    value={task.status ?? "in-progress"}
                    onChange={(e) =>
                      updateTask(index, {
                        status: e.target.value as WeeklyTaskEntry["status"],
                      })
                    }
                    className="rounded px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
                  >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </label>
                <button
                  onClick={() => removeWeek(index)}
                  className="text-sm text-rose-300 hover:text-rose-200"
                >
                  Remove
                </button>
              </div>

              <label className="block text-sm text-gray-300">
                <span className="block">Tasks (one per line)</span>
                <textarea
                  value={(task.items ?? []).join("\n")}
                  onChange={(e) => updateTaskItems(index, e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
                  placeholder="Implemented auth\nFixed bugs\nPublished blog post"
                />
              </label>

              <label className="block text-sm text-gray-300">
                <span className="block">Notes</span>
                <textarea
                  value={task.notes ?? ""}
                  onChange={(e) => updateTask(index, { notes: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
                  placeholder="Context, blockers, or wins"
                />
              </label>

              <label className="block text-sm text-gray-300">
                <span className="block">Resources / link</span>
                <input
                  value={task.link ?? ""}
                  onChange={(e) => updateTask(index, { link: e.target.value })}
                  className="mt-1 w-full rounded-lg px-3 py-2 bg-slate-800/70 border border-white/10 text-white"
                  placeholder="Links to demos, PRs, or documents"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
