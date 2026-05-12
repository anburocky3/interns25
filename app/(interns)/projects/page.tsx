"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getUserProjectWeeks, saveUserProjectWeeks } from "@/lib/projectWeeks";
import {
  ProjectWeeksFormSchema,
  ProjectWeekEntryForm,
} from "@/lib/projectWeeks.schema";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, Label } from "@/components/ui";

export default function ProjectWeeksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loadingWeeks, setLoadingWeeks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(ProjectWeeksFormSchema),
    defaultValues: {
      weeks: Array.from({ length: 25 }, (_, i) => ({
        week: i + 1,
        title: "",
        description: "",
        sourceCode: "",
        demo: "",
        acknowledgments: "",
        notes: "",
        status: "pending" as const,
      })),
    },
    mode: "onBlur",
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  const { fields } = useFieldArray({ control, name: "weeks" });

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setLoadingWeeks(true);
      getUserProjectWeeks(user.uid)
        .then((weeks) => {
          reset({ weeks });
        })
        .catch(() => setError("Failed to load project weeks."))
        .finally(() => setLoadingWeeks(false));
    }
  }, [user, reset]);

  const onSubmit = useCallback(
    async (data: { weeks: ProjectWeekEntryForm[] }) => {
      if (!user) return;
      setError(null);
      setSuccess(null);
      // Ensure all fields are strings (not undefined)
      const weeks = data.weeks.map((w) => ({
        ...w,
        sourceCode: w.sourceCode ?? "",
        demo: w.demo ?? "",
        acknowledgments: w.acknowledgments ?? "",
        notes: w.notes ?? "",
        status: w.status ?? "pending",
      }));
      try {
        await saveUserProjectWeeks(user.uid, weeks);
        setSuccess("Project weeks saved successfully!");
      } catch {
        setError("Failed to save project weeks.");
      }
    },
    [user],
  );

  if (loading || loadingWeeks) {
    return <div className="p-8 text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-sky-700">
        25-Week Internship Projects
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Internship start date: November 1, 2025 */}
        {fields.map((field, idx) => {
          const status = form.watch(`weeks.${idx}.status`) ?? "pending";
          const allWeeks = form.getValues("weeks");
          const rejectionReason = (
            allWeeks[idx] as unknown as { rejectionReason?: string }
          )?.rejectionReason;
          const startDate = new Date(2025, 10, 1); // November 1, 2025
          const weekStart = new Date(
            startDate.getTime() + idx * 7 * 24 * 60 * 60 * 1000,
          );
          const weekEnd = new Date(
            weekStart.getTime() + 6 * 24 * 60 * 60 * 1000,
          );
          const weekLabel = `${format(weekStart, "MMM d, yyyy")} - ${format(weekEnd, "MMM d, yyyy")}`;
          return (
            <div
              key={field.id}
              className="bg-white dark:bg-neutral-900 rounded-lg shadow p-6 mb-4 border border-sky-100 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-semibold text-sky-600 dark:text-sky-300">
                    Week {field.week}
                  </h2>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {weekLabel}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    status === "accepted"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                      : status === "rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
              {status === "rejected" && rejectionReason && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-3">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
                    Rejection Reason:
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">
                    {rejectionReason}
                  </p>
                </div>
              )}
              {status === "accepted" && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ This submission has been approved and is now locked for
                    editing.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Project Title</Label>
                  <Input
                    disabled={status === "accepted"}
                    {...form.register(`weeks.${idx}.title`)}
                    placeholder="e.g. Attendance Tracker"
                    className="bg-white dark:bg-neutral-800 text-black dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.weeks?.[idx]?.title && (
                    <p className="text-red-500 text-xs mt-1 dark:text-red-400">
                      {errors.weeks[idx]?.title?.message as string}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Source Code Link</Label>
                  <Input
                    disabled={status === "accepted"}
                    type="url"
                    {...form.register(`weeks.${idx}.sourceCode`)}
                    placeholder="e.g. https://github.com/yourrepo"
                    className="bg-white dark:bg-neutral-800 text-black dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.weeks?.[idx]?.sourceCode && (
                    <p className="text-red-500 text-xs mt-1 dark:text-red-400">
                      {errors.weeks[idx]?.sourceCode?.message as string}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    disabled={status === "accepted"}
                    rows={3}
                    {...form.register(`weeks.${idx}.description`)}
                    placeholder="Describe your project for this week..."
                    className="bg-white dark:bg-neutral-800 text-black dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.weeks?.[idx]?.description && (
                    <p className="text-red-500 text-xs mt-1 dark:text-red-400">
                      {errors.weeks[idx]?.description?.message as string}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Demo Link</Label>
                  <Input
                    disabled={status === "accepted"}
                    type="url"
                    {...form.register(`weeks.${idx}.demo`)}
                    placeholder="e.g. https://yourdemo.com"
                    className="bg-white dark:bg-neutral-800 text-black dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.weeks?.[idx]?.demo && (
                    <p className="text-red-500 text-xs mt-1 dark:text-red-400">
                      {errors.weeks[idx]?.demo?.message as string}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Acknowledgments</Label>
                  <Input
                    disabled={status === "accepted"}
                    type="url"
                    {...form.register(`weeks.${idx}.acknowledgments`)}
                    placeholder="e.g. Thanks to my mentor..."
                    className="bg-white dark:bg-neutral-800 text-black dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.weeks?.[idx]?.acknowledgments && (
                    <p className="text-red-500 text-xs mt-1 dark:text-red-400">
                      {errors.weeks[idx]?.acknowledgments?.message as string}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    disabled={status === "accepted"}
                    rows={2}
                    {...form.register(`weeks.${idx}.notes`)}
                    placeholder="Any extra notes for this week..."
                    className="bg-white dark:bg-neutral-800 text-black dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.weeks?.[idx]?.notes && (
                    <p className="text-red-500 text-xs mt-1 dark:text-red-400">
                      {errors.weeks[idx]?.notes?.message as string}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="flex items-center gap-2 text-lg py-3 px-8 bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800 rounded-full shadow-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {isSubmitting ? "Saving..." : "Save All Weeks"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Button>
        </div>
        {error && (
          <div className="text-red-500 mt-2 dark:text-red-400 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 mt-2 dark:text-green-400 text-center">
            {success}
          </div>
        )}
      </form>
    </div>
  );
}
