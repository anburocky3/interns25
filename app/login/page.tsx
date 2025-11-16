"use client";

import AttendanceCheckin from "@/components/AttendanceCheckin";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { deniedMessage } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Login Page</h1>
      <p className="text-lg">This is where the login form will go.</p>
      {deniedMessage ? (
        <div className="mb-4 text-sm text-red-700">{deniedMessage}</div>
      ) : null}
      <AttendanceCheckin />
    </div>
  );
}
