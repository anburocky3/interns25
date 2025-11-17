"use client";
import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AuthProvider>
      {children}
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
    </AuthProvider>
  );
};

export default Providers;
