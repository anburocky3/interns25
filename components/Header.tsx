"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export const Header: React.FC = () => {
  const { signInWithGoogle, deniedMessage, user, signOut } = useAuth();
  const pathname = usePathname();

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertText, setAlertText] = useState<string | null>(null);

  useEffect(() => {
    if (deniedMessage) {
      // Defer state updates to avoid synchronous setState within effect
      Promise.resolve().then(() => {
        setAlertText(deniedMessage);
        setAlertOpen(true);
      });
    }
  }, [deniedMessage]);

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };
  return (
    <header className="w-full bg-dark  sticky top-0 z-50 shadow-md p-5 border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between ">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold">
            <Image
              src="/images/cyberdude-light.svg"
              alt="CyberDude Logo"
              height={0}
              width={0}
              loading="eager"
              style={{ width: "120px", height: "auto" }}
            />
          </Link>
        </div>
        <div className="flex items-center space-x-6 font-medium">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={`hover:text-blue-300 px-2 py-1 rounded ${
                  isActive("/dashboard") ? "text-orange-300" : "text-white/90"
                }`}
                aria-current={isActive("/") ? "page" : undefined}
              >
                Dashboard
              </Link>
              <Link
                href="/leaves"
                className={`hover:text-blue-300 px-2 py-1 rounded ${
                  isActive("/leaves") ? "text-orange-300" : "text-white/90"
                }`}
                aria-current={isActive("/leaves") ? "page" : undefined}
              >
                Leaves
              </Link>
              <div className="flex items-center gap-3">
                <Image
                  src={user.photoURL ?? "/images/avatar-placeholder.png"}
                  alt={user.displayName ?? user.email ?? "User avatar"}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium whitespace-nowrap">
                    {user.displayName ?? user.email?.split("@")[0] ?? "User"}
                  </span>
                  <span className="text-xs">{user.email}</span>
                </div>
                <button
                  aria-label="Logout"
                  title="Logout"
                  onClick={() =>
                    signOut().finally(() => alert("Successfully logged out."))
                  }
                  className="p-2 rounded hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/"
                className={`hover:text-blue-300 px-2 py-1 rounded ${
                  isActive("/") ? "text-orange-300" : "text-white/90"
                }`}
                aria-current={isActive("/") ? "page" : undefined}
              >
                Profiles
              </Link>
              <Link
                href="/presentations"
                className={`hover:text-blue-300 px-2 py-1 rounded ${
                  isActive("/presentations")
                    ? "text-orange-300"
                    : "text-white/90"
                }`}
                aria-current={isActive("/presentations") ? "page" : undefined}
              >
                Who&apos;s Next?
              </Link>
              <button
                type="button"
                className="bg-white text-blue-600 px-4 py-1 rounded-md shadow hover:bg-gray-100"
                onClick={() =>
                  signInWithGoogle().catch((err: unknown) => {
                    const message =
                      err instanceof Error ? err.message : String(err);
                    setAlertText(message || "Access denied.");
                    setAlertOpen(true);
                  })
                }
              >
                <LogIn className="inline-block mr-2 h-4 w-4" />
                <span>Login</span>
              </button>
            </>
          )}
        </div>
      </div>
      {alertOpen && alertText ? (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="max-w-lg w-full bg-dark rounded shadow p-6">
            <h3 className="text-lg font-semibold mb-2">
              Access Denied, Its for Members Only!
            </h3>
            <p className="text-sm text-gray-700 mb-4">{alertText}</p>
            <div className="text-right">
              <button
                onClick={() => setAlertOpen(false)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Header;
