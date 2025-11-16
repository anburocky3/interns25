"use client";
import React from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export const Header: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const pathname = usePathname();

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
              isActive("/presentations") ? "text-orange-300" : "text-white/90"
            }`}
            aria-current={isActive("/presentations") ? "page" : undefined}
          >
            Who&apos;s Next?
          </Link>
          <button
            type="button"
            className="bg-white text-blue-600 px-4 py-1 rounded-md shadow hover:bg-gray-100"
            onClick={() => signInWithGoogle()}
          >
            <LogIn className="inline-block mr-2 h-4 w-4" />
            <span>Login</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
