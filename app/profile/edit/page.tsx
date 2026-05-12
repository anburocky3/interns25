"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  fetchInternProfile,
  generateSlug,
  normalizeWeeklyTasks,
  saveInternProfile,
} from "@/lib/internProfile";
import { InternProfile, WeeklyTaskEntry } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<InternProfile>();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
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
    if (authLoading) return;

    if (!user) {
      toast.error("Please log in to edit your profile");
      router.push("/");
      return;
    }

    setLoading(true);
    fetchInternProfile(user.uid)
      .then((data) => {
        if (!data) {
          setError("Profile not found");
          return;
        }
        setProfile(data);
        setName(data.name ?? "");
        setUsername(data.username ?? "");
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
        console.error("Failed to load profile for editing", err);
        setError("Could not load your profile");
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

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
      const finalUsername = username.trim() || generateSlug(name);
      await saveInternProfile(profile.uid, {
        name: name.trim() || "",
        username: finalUsername,
        slug: finalUsername,
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
      router.push(`/profile`);
    } catch (err) {
      console.error("Failed to save profile", err);
      setError("Saving failed. Please try again.");
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-10 max-w-4xl mx-auto">
        <div className="text-gray-300">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-10 max-w-4xl mx-auto">
        <div className="text-red-400">
          You must be logged in to edit your profile
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-10 max-w-4xl mx-auto">
        <div className="text-red-400">
          You do not have permission to edit this profile
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard`}
          className="hover:bg-white/10 p-2 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Edit Your Profile</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-600/20 border border-red-600 text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Mobile
                </label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={isStudent}
                  onChange={(e) => setIsStudent(e.target.checked)}
                  className="rounded"
                />
                Student
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={hasWifi}
                  onChange={(e) => setHasWifi(e.target.checked)}
                  className="rounded"
                />
                Has WiFi
              </label>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Social Links
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                LinkedIn
              </label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">GitHub</label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Website
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Instagram
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Tasks Tracker
              </label>
              <input
                type="text"
                value={tasksLink}
                onChange={(e) => setTasksLink(e.target.value)}
                placeholder="Task tracker URL"
                className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Weekly Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Weekly Tasks</h2>
            <button
              onClick={addWeek}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
            >
              Add Week
            </button>
          </div>

          <div className="space-y-6">
            {weeklyTasks.map((task, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-700/50 border border-white/10 rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-gray-300">
                    Week {task.week}
                  </h3>
                  <button
                    onClick={() => removeWeek(idx)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                  >
                    Remove
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={task.title ?? ""}
                    onChange={(e) => updateTask(idx, { title: e.target.value })}
                    placeholder="Week title"
                    className="w-full px-3 py-2 bg-slate-600 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={task.status ?? "in-progress"}
                    onChange={(e) =>
                      updateTask(idx, {
                        status: e.target.value as
                          | "planned"
                          | "in-progress"
                          | "done",
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-600 border border-white/10 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Tasks (one per line)
                  </label>
                  <textarea
                    value={(task.items ?? []).join("\n")}
                    onChange={(e) => updateTaskItems(idx, e.target.value)}
                    placeholder="Task 1&#10;Task 2&#10;Task 3"
                    className="w-full px-3 py-2 bg-slate-600 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm min-h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={task.notes ?? ""}
                    onChange={(e) => updateTask(idx, { notes: e.target.value })}
                    placeholder="Additional notes"
                    className="w-full px-3 py-2 bg-slate-600 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm min-h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Resource Link
                  </label>
                  <input
                    type="text"
                    value={task.link ?? ""}
                    onChange={(e) => updateTask(idx, { link: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-600 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <Link
          href={`/profile`}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
