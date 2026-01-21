"use client";
import React, { useEffect, useState } from "react";
import { db, serverTimestamp } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { GraduationCap, Wifi } from "lucide-react";
import { formatIsoDate, githubAvatarFromUrl } from "@/lib/helpers";
import { getCachedUsers } from "@/lib/getUsers";
import Image from "next/image";
import Link from "next/link";
import { InternProfile } from "@/types";

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function ModeratorPanel() {
  const { user } = useAuth();
  const [interns, setInterns] = useState<InternProfile[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sessionLink, setSessionLink] = useState(
    "https://meet.google.com/add-iwqc-peo",
  );
  const [sessionNote, setSessionNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [mom, setMom] = useState("");
  const [pastMoms, setPastMoms] = useState<
    Array<{ date: string; text: string }>
  >([]);
  const dateKey = todayISO();

  useEffect(() => {
    const loadInterns = async () => {
      try {
        const users = await getCachedUsers("dev");
        setInterns(users);
        // reset selection when intern list changes
        setSelected((prev) => {
          const next: Record<string, boolean> = {};
          users.forEach((it) => {
            next[it.uid] = !!prev[it.uid];
          });
          return next;
        });
      } catch (err) {
        console.error("Error loading interns:", err);
        toast.error("Failed to load interns");
      } finally {
        setLoading(false);
      }
    };

    loadInterns();
  }, []);

  useEffect(() => {
    // attendance listener
    const attRef = collection(db, "attendance");
    const q = query(attRef, where("date", "==", dateKey));
    const unsub = onSnapshot(q, (snap) => {
      const map: Record<string, boolean> = {};
      snap.forEach((s) => {
        const d = s.data() as
          | { userId?: string; present?: boolean }
          | undefined;
        if (d?.userId) map[d.userId] = Boolean(d.present);
      });
      setAttendance(map);
    });

    return () => unsub();
  }, [dateKey]);

  useEffect(() => {
    // load today's MoM and recent MoMs
    const metaRef = doc(db, "mom", dateKey);
    const unsubToday = onSnapshot(metaRef, (snap) => {
      const d = snap.data() as { text?: string } | undefined;
      setMom(d?.text || "");
    });

    const momsRef = collection(db, "mom");
    const momsQ = query(momsRef);
    const unsubPast = onSnapshot(momsQ, (snap) => {
      const arr: Array<{ date: string; text: string }> = [];
      snap.forEach((s) => {
        const dd = s.data() as { text?: string; date?: string } | undefined;
        if (dd?.date) arr.push({ date: dd.date, text: dd.text || "" });
      });
      // sort desc
      arr.sort((a, b) => (a.date < b.date ? 1 : -1));
      setPastMoms(arr.slice(0, 20));
    });

    return () => {
      unsubToday();
      unsubPast();
    };
  }, [dateKey]);

  const togglePresent = async (uid: string) => {
    try {
      const attId = `${dateKey}::${uid}`;
      const attRef = doc(db, "attendance", attId);
      const newVal = !Boolean(attendance[uid]);
      await setDoc(
        attRef,
        {
          id: attId,
          date: dateKey,
          userId: uid,
          present: newVal,
          updatedAt: serverTimestamp(),
          markedBy: user?.uid || null,
        },
        { merge: true },
      );
      toast.success("Attendance updated");
    } catch (err) {
      console.error(err);
      toast.error("Unable to update attendance");
    }
  };

  const postSession = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!sessionLink) {
      toast.error("Please add a session link.");
      return;
    }

    try {
      const docRef = doc(db, "meta", "currentSession");
      await setDoc(
        docRef,
        {
          link: sessionLink,
          note: sessionNote || null,
          postedBy: user?.uid || null,
          postedAt: serverTimestamp(),
          date: dateKey,
        },
        { merge: true },
      );
      toast.success("Session link posted");
      setSessionLink("");
      setSessionNote("");
    } catch (err) {
      console.error(err);
      toast.error("Unable to post session link");
    }
  };

  const saveMom = async () => {
    try {
      const momRef = doc(db, "mom", dateKey);
      await setDoc(
        momRef,
        {
          date: dateKey,
          text: mom,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid || null,
        },
        { merge: true },
      );
      toast.success("Saved minutes of meeting");
    } catch (err) {
      console.error(err);
      toast.error("Unable to save MoM");
    }
  };

  if (loading) return <div className="p-6">Loading moderator tools...</div>;

  return (
    <div className="p-6">
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">
            Attendance for {formatIsoDate(dateKey)}
          </h3>
          <Link
            href="/mods/attendance"
            className="px-3 py-1 bg-blue-600 rounded text-sm"
          >
            View Attendance Overview
          </Link>
        </div>

        <div className="my-5 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-green-500"
              checked={
                interns.length > 0 && interns.every((it) => selected[it.uid])
              }
              onChange={(e) => {
                const on = e.target.checked;
                setSelected(() => {
                  const next: Record<string, boolean> = {};
                  interns.forEach((it) => {
                    next[it.uid] = on;
                  });
                  return next;
                });
              }}
            />
            <span className="select-none">Select all</span>
          </label>
          <button
            onClick={async () => {
              const ids = Object.keys(selected).filter((id) => selected[id]);
              if (ids.length === 0) return toast.error("No interns selected");
              try {
                const promises = ids.map((uid) => {
                  const attId = `${dateKey}::${uid}`;
                  const attRef = doc(db, "attendance", attId);
                  return setDoc(
                    attRef,
                    {
                      id: attId,
                      date: dateKey,
                      userId: uid,
                      present: true,
                      updatedAt: serverTimestamp(),
                      markedBy: user?.uid || null,
                    },
                    { merge: true },
                  );
                });
                await Promise.all(promises);
                toast.success("Marked selected present");
              } catch (err) {
                console.error(err);
                toast.error("Unable to mark selected");
              }
            }}
            className="px-3 py-1 bg-green-600 rounded text-sm"
          >
            Mark Selected Present
          </button>
          <button
            onClick={async () => {
              const ids = Object.keys(selected).filter((id) => selected[id]);
              if (ids.length === 0) return toast.error("No interns selected");
              try {
                const promises = ids.map((uid) => {
                  const attId = `${dateKey}::${uid}`;
                  const attRef = doc(db, "attendance", attId);
                  return setDoc(
                    attRef,
                    {
                      id: attId,
                      date: dateKey,
                      userId: uid,
                      present: false,
                      updatedAt: serverTimestamp(),
                      markedBy: user?.uid || null,
                    },
                    { merge: true },
                  );
                });
                await Promise.all(promises);
                toast.success("Marked selected absent");
              } catch (err) {
                console.error(err);
                toast.error("Unable to mark selected");
              }
            }}
            className="px-3 py-1 bg-gray-600 rounded text-sm"
          >
            Mark Selected Absent
          </button>
        </div>

        <div className="grid gap-2">
          {interns.map((i) => (
            <div
              key={i.uid}
              className={`flex items-center justify-between  p-3 rounded ${
                !!selected[i.uid] ? "bg-emerald-500/30" : "bg-white/5"
              }`}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                // ignore clicks on inputs or buttons inside the row
                if (
                  target.tagName === "INPUT" ||
                  target.tagName === "BUTTON" ||
                  target.closest("button") ||
                  target.closest("a")
                )
                  return;
                setSelected((prev) => ({ ...prev, [i.uid]: !prev[i.uid] }));
              }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="accent-green-500"
                  checked={!!selected[i.uid]}
                  onChange={(e) =>
                    setSelected((prev) => ({
                      ...prev,
                      [i.uid]: e.target.checked,
                    }))
                  }
                />
                {i.social?.github ? (
                  <Image
                    src={githubAvatarFromUrl(i.social?.github) || ""}
                    alt={i.name || "User"}
                    width={40}
                    height={40}
                    className={`w-10 h-10 rounded-full `}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                    {i.name ? i.name.charAt(0) : "U"}
                  </div>
                )}
                <div>
                  <div className="flex items-center font-medium">
                    <span>{i.name}</span>

                    <div className="flex gap-2 mt-1 items-center text-gray-200 ml-2">
                      {i.isStudent && (
                        <span
                          title="Student"
                          aria-label="Student"
                          className="px-1 py-0.5 rounded bg-indigo-600"
                        >
                          <GraduationCap size={16} />
                        </span>
                      )}
                      {i.hasWifi && (
                        <span
                          title="Has WiFi"
                          aria-label="Has WiFi"
                          className="px-1 py-0.5 rounded bg-emerald-600"
                        >
                          <Wifi size={16} />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{i.position}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePresent(i.uid)}
                  className={`px-3 py-1 rounded ${
                    attendance[i.uid] ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  {attendance[i.uid] ? "Present" : "Absent"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-medium mb-2">Post Session Link</h3>
        <form onSubmit={postSession} className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded bg-white/5"
            placeholder="Session URL (Zoom / Meet / Stream)"
            value={sessionLink}
            onChange={(e) => setSessionLink(e.target.value)}
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 rounded">
            Post
          </button>
        </form>
        <textarea
          className="w-full mt-2 p-2 rounded bg-white/5"
          placeholder="Optional note for the session"
          value={sessionNote}
          onChange={(e) => setSessionNote(e.target.value)}
        />
      </section>

      <section className="mb-6">
        <h3 className="font-medium mb-2">Minutes of Meeting (MoM)</h3>
        <textarea
          value={mom}
          onChange={(e) => setMom(e.target.value)}
          placeholder="Write today's minutes..."
          className="w-full p-3 rounded bg-white/5 h-40"
        />
        <div className="flex gap-2 mt-2">
          <button onClick={saveMom} className="px-4 py-2 bg-green-600 rounded">
            Save
          </button>
          <button
            onClick={() => {
              setMom("");
            }}
            className="px-4 py-2 bg-gray-600 rounded"
          >
            Clear
          </button>
        </div>
      </section>

      <section>
        <h3 className="font-medium mb-2">Recent Minutes</h3>
        <div className="grid gap-2">
          {pastMoms.map((m) => (
            <div key={m.date} className="p-3 bg-white/3 rounded">
              <div className="text-sm text-gray-300">{m.date}</div>
              <div className="mt-1">{m.text}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
