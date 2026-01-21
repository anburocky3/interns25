"use client";
import React, { useRef, useState } from "react";
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
  Play,
  Pause,
} from "lucide-react";
import { githubAvatarFromUrl } from "@/lib/helpers";
import { InternProfile } from "@/types";

export const InternCard: React.FC<{ intern: InternProfile }> = ({ intern }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = percent * duration;
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

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

        {/* Self-Introduction Audio Player */}
        {intern.audioIntroUrl && (
          <div className="mt-4 bg-linear-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 rounded-xl p-1 hover:border-purple-500/60 transition-all">
            <audio
              ref={audioRef}
              src={intern.audioIntroUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="shrink-0 p-1 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full transition-all shadow-lg hover:shadow-purple-500/50"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="flex-1 flex flex-col gap-2">
                {/* Progress Bar */}
                <div
                  onClick={handleProgressClick}
                  className="group relative w-full h-2 bg-gray-700 rounded-full cursor-pointer hover:h-2.5 transition-all"
                >
                  <div
                    className="bg-linear-to-r from-purple-400 to-indigo-400 h-full rounded-full transition-all shadow-lg shadow-purple-500/50 relative"
                    style={{
                      width: duration
                        ? `${(currentTime / duration) * 100}%`
                        : "0%",
                    }}
                  >
                    {duration > 0 && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                {/* Time Display */}
                {/* <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div> */}
              </div>
            </div>
          </div>
        )}
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
