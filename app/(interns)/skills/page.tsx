"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TypingTestModule from "@/components/TypingTestModule";

export default function SkillsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (!user || loading) {
    return null;
  }

  return (
    <div className="my-10 container mx-auto">
      {/* Display a project update notification */}
      <div
        className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 flex items-center justify-between"
        role="alert"
      >
        <div>
          <p className="font-bold">Project Update Available</p>
          <p>Manage your 25-week internship projects!</p>
        </div>
        <button
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={() => router.push("/projects")}
        >
          View Project Updates
        </button>
      </div>
      <TypingTestModule />
    </div>
  );
}
