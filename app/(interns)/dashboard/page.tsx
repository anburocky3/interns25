"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import AdminPanel from "@/components/dashboard/AdminPanel";
import InternDashboard from "@/components/dashboard/InternDashboard";

export default function DashboardPage() {
  const { user, loading, role } = useAuth();

  if (loading) {
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

  return role === "admin" ? <AdminPanel /> : <InternDashboard />;
}
