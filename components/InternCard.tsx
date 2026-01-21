"use client";
import React from "react";
import Image from "next/image";
import {
  GraduationCap,
  Wifi,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Instagram,
  InstagramIcon,
  LucideGithub,
  GithubIcon,
  Volume2,
} from "lucide-react";
import { githubAvatarFromUrl } from "@/lib/helpers";
import { InternProfile } from "@/types";

export const InternCard: React.FC<{ intern: InternProfile }> = ({ intern }) => {
  const avatarSrc =
    intern.avatar ||
    githubAvatarFromUrl(intern.social?.github) ||
    "/default-avatar.png";

  return (
    <div className="bg-neutral-800 rounded-lg p-4 text-center shadow-md">
      <div className="relative flex justify-center mt-2 mb-5">
        <Image
          alt={intern.name}
          loading="lazy"
          width={192}
          height={192}
          className="w-48 shadow-lg rounded-full object-cover"
          src={avatarSrc}
        />

        <div className="absolute top-2 right-2 flex items-center gap-2">
          {intern.social?.instagram ? (
            <a
              href={intern.social?.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="instagram"
              className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full shadow-md"
            >
              <InstagramIcon size={16} />
            </a>
          ) : null}

          {intern.social?.linkedin ? (
            <a
              href={intern.social.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="bg-[#0A66C2] hover:bg-[#085aa8] text-white p-2 rounded-full shadow-md"
            >
              <Linkedin size={16} />
            </a>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <h4 className="font-semibold text-xl text-white truncate">
          {intern.name}
        </h4>
        <p className="text-gray-300 text-sm truncate">
          {intern.position ?? "Intern"}
        </p>

        {/* Self-Introduction Audio Player */}
        {intern.audioIntroUrl && (
          <div className="mt-3 flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
            <Volume2 size={16} className="text-purple-400 shrink-0" />
            <audio
              src={intern.audioIntroUrl}
              controls
              className="flex-1 h-6"
              controlsList="nodownload"
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-2">
          {intern.location ? (
            <span className="text-xs bg-neutral-700 text-gray-200 px-2 py-1 rounded">
              {intern.location}
            </span>
          ) : null}
          {intern.isStudent ? (
            <span
              title="Student"
              className="p-1 bg-emerald-700 text-white rounded-full"
            >
              <GraduationCap size={16} />
            </span>
          ) : null}
          {intern.hasWifi ? (
            <span
              title="Has Wi‑Fi"
              className="p-1 bg-indigo-600 text-white rounded-full"
            >
              <Wifi size={16} />
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:space-x-3 text-sm font-semibold">
        <a
          target="_blank"
          rel="noreferrer"
          className="flex justify-center bg-amber-500 hover:bg-amber-600 items-center px-3 text-white py-1.5 rounded"
          href={intern.social?.tasks}
        >
          <ExternalLink className="mr-1" size={16} />
          Tasks
        </a>

        <a
          target="_blank"
          rel="noreferrer"
          className="flex justify-center bg-white hover:bg-gray-200 items-center px-3 text-neutral-900 py-1.5 rounded"
          href={intern.social?.github}
        >
          <GithubIcon className="mr-1" size={16} />
          Github
        </a>
      </div>
    </div>
  );
};

export default InternCard;
