"use client";

import { useRef, useState } from "react";
import { Mic, Trash2, Check, AlertCircle, Upload } from "lucide-react";
import toast from "react-hot-toast";

interface AudioUploadProps {
  onUploadSuccess?: (audioUrl: string) => void;
  currentAudioUrl?: string;
  maxFileSize?: number; // in bytes, default 600KB
  userName?: string; // User's name for file prefix
}

export default function AudioUpload({
  onUploadSuccess,
  currentAudioUrl,
  maxFileSize = 600 * 1024, // 600KB default
  userName,
}: AudioUploadProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordingRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState(currentAudioUrl);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingIntervalId, setRecordingIntervalId] =
    useState<NodeJS.Timeout | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPreviewingRecording, setIsPreviewingRecording] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const validateFile = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");
      return false;
    }

    if (file.size > maxFileSize) {
      toast.error(`File size must be less than ${maxFileSize / 1024}KB`);
      return false;
    }

    return true;
  };

  const uploadAudio = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      // Add user name for file prefix
      if (userName) {
        formData.append("userName", userName);
      }
      // Add old audio URL to delete from storage
      if (uploadedAudioUrl) {
        formData.append("oldAudioUrl", uploadedAudioUrl);
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setUploadedAudioUrl(response.url);
          setUploadProgress(100);
          setRecordedBlob(null);
          setIsPreviewingRecording(false);
          onUploadSuccess?.(response.url);
          toast.success("Audio uploaded successfully!");
        } else {
          throw new Error("Upload failed");
        }
        setIsUploading(false);
      });

      xhr.addEventListener("error", () => {
        toast.error("Upload failed. Please try again.");
        setIsUploading(false);
        setUploadProgress(0);
      });

      xhr.open("POST", "/api/upload-audio");
      xhr.send(formData);
    } catch {
      toast.error("An error occurred during upload");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const startRecording = async () => {
    try {
      // Clear any previous recording preview
      setRecordedBlob(null);
      setIsPreviewingRecording(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fileBlob = blob as unknown as File;
        if (validateFile(fileBlob)) {
          setRecordedBlob(blob);
          setIsPreviewingRecording(true);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      recordingRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const intervalId = setInterval(() => {
        setRecordingTime((t) => {
          const nextTime = t + 1;
          // Auto-stop at exactly 30 seconds
          if (t >= 30) {
            if (mediaRecorder.state === "recording") {
              mediaRecorder.stop();
              setIsRecording(false);
            }
            if (intervalId) {
              clearInterval(intervalId);
            }
          }
          return nextTime;
        });
      }, 1000);

      setRecordingIntervalId(intervalId);
      toast.success("Recording started");
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (recordingRef.current && isRecording) {
      recordingRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (recordingIntervalId) {
        clearInterval(recordingIntervalId);
        setRecordingIntervalId(null);
      }
    }
  };

  const pauseRecording = () => {
    if (recordingRef.current && recordingRef.current.state === "recording") {
      recordingRef.current.pause();
      setIsPaused(true);
      toast.success("Recording paused");
    }
  };

  const resumeRecording = () => {
    if (recordingRef.current && recordingRef.current.state === "paused") {
      recordingRef.current.resume();
      setIsPaused(false);
      toast.success("Recording resumed");
    }
  };

  const deleteAudio = async () => {
    if (!uploadedAudioUrl) {
      toast.error("No audio to delete");
      return;
    }

    try {
      setIsUploading(true);
      const response = await fetch("/api/upload-audio", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audioUrl: uploadedAudioUrl }),
      });

      if (response.ok) {
        setUploadedAudioUrl(undefined);
        onUploadSuccess?.(undefined as unknown as string);
        toast.success("Audio removed");
      } else {
        toast.error("Failed to delete audio");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete audio");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadRecording = async () => {
    if (!recordedBlob) {
      toast.error("No recording to upload");
      return;
    }

    const audioFile = new File(
      [recordedBlob],
      `self-intro-${Date.now()}.webm`,
      {
        type: "audio/webm",
      },
    );
    uploadAudio(audioFile);
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setIsPreviewingRecording(false);
    setRecordingTime(0);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-2xl shadow-2xl border border-white/10 hover:border-white/20 transition-all">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Mic className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Self-Introduction Audio
            </h3>
          </div>
          <p className="text-sm text-gray-400">
            Record or upload your self-introduction (max 600KB, audio only)
          </p>
        </div>

        {/* Recording Waveform */}
        {isRecording && (
          <div className="mb-6 p-6 bg-linear-to-r from-red-500/10 to-red-400/5 border border-red-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-red-500 rounded-full animate-pulse opacity-20" />
                  <div
                    className="absolute w-8 h-8 bg-red-500 rounded-full animate-pulse opacity-40"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <Mic className="w-5 h-5 text-red-500 relative z-10" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-300">
                    {isPaused ? "Recording paused" : "Recording..."}
                  </p>
                  <p className="text-xs text-red-400 mt-1">
                    {isPaused
                      ? "Click resume to continue"
                      : "Use pause/stop controls below"}
                  </p>
                </div>
              </div>
              <span className="text-lg font-mono font-bold text-red-400 tracking-wide">
                {formatTime(recordingTime)}
              </span>
            </div>
            <div className="flex gap-2">
              {!isPaused ? (
                <>
                  <button
                    onClick={pauseRecording}
                    className="flex-1 px-3 py-2 rounded-lg bg-yellow-600/40 hover:bg-yellow-600/50 text-yellow-300 font-medium transition"
                  >
                    ⏸ Pause
                  </button>
                  <button
                    onClick={stopRecording}
                    className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
                  >
                    ⏹ Stop
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={resumeRecording}
                    className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition"
                  >
                    ▶ Resume
                  </button>
                  <button
                    onClick={stopRecording}
                    className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
                  >
                    ⏹ Stop
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Recorded Preview (Before Upload) */}
        {isPreviewingRecording && recordedBlob && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-amber-500/20 rounded">
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm font-medium text-amber-400">
                Recording Ready - Preview & Confirm
              </span>
            </div>
            <audio
              src={URL.createObjectURL(recordedBlob)}
              controls
              className="w-full h-8 rounded mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={uploadRecording}
                disabled={isUploading}
                className="flex-1 px-3 py-2 rounded-lg bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium transition disabled:opacity-50"
              >
                ✅ Upload This Recording
              </button>
              <button
                onClick={discardRecording}
                disabled={isUploading}
                className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium transition disabled:opacity-50"
              >
                ❌ Discard
              </button>
            </div>
          </div>
        )}

        {/* Audio Preview */}
        {uploadedAudioUrl && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 rounded">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-emerald-400">
                  Audio Uploaded
                </span>
              </div>
              <button
                onClick={deleteAudio}
                disabled={isUploading}
                className="p-2 hover:bg-red-500/20 rounded transition text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <audio
              ref={audioRef}
              src={uploadedAudioUrl}
              controls
              className="w-full h-8 rounded"
            />
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded animate-pulse">
                <Upload className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-blue-300">
                Uploading...
              </span>
              <span className="ml-auto text-sm font-semibold text-blue-300">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-linear-to-r from-blue-400 to-cyan-400 h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full">
          {/* Record Button - Only show when not recording */}
          {!isRecording && (
            <button
              onClick={startRecording}
              disabled={isUploading}
              className="w-full px-4 py-3 font-semibold transition-all duration-300 flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              Record Audio
            </button>
          )}
        </div>

        {/* Self-Intro Format Guide */}
        {!uploadedAudioUrl && (
          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-indigo-300 mb-2">
                📝 Suggested Format (30 seconds)
              </h4>
            </div>
            <div className="space-y-2 text-sm text-indigo-200">
              <p>
                <span className="font-semibold text-indigo-300">
                  1. Introduction:
                </span>{" "}
                &quot;Hi, my name is {userName}&quot;
              </p>
              <p>
                <span className="font-semibold text-indigo-300">
                  2. Background:
                </span>{" "}
                Share your education, skills, or experience
              </p>
              <p>
                <span className="font-semibold text-indigo-300">
                  3. Interest:
                </span>{" "}
                What interests you most about this role/company
              </p>
              <p>
                <span className="font-semibold text-indigo-300">
                  4. Closing:
                </span>{" "}
                &quot;Thank you for the opportunity!&quot;
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-indigo-500/30">
              <div className="flex items-start gap-2 text-xs text-indigo-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p>• Keep it natural and conversational</p>
                  <p>• Speak clearly at a moderate pace</p>
                  <p>• Recording auto-stops at 30 seconds</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
