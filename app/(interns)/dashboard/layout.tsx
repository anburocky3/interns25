"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If we finished loading and there's no authenticated user,
    // redirect to the home/login page.
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-gray-300">Checking access...</div>
      </div>
    );
  }

  // If not loading and user is missing, we already redirected above.
  // Render children for allowed users.
  return <>{children}</>;
}
