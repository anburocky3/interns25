"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

interface AuthContextValue {
  user: FirebaseUser | null;
  role: "intern" | "admin" | null;
  isModerator: boolean;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deniedMessage?: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<"intern" | "admin" | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let unsubUser: (() => void) | undefined;

    const unsub = onAuthStateChanged(auth, async (u) => {
      // reset denied message on auth change
      setDeniedMessage(null);
      setLoading(true);

      if (unsubUser) {
        unsubUser();
        unsubUser = undefined;
      }

      if (!u) {
        setUser(null);
        setRole(null);
        setIsAdmin(false);
        setIsModerator(false);
        setLoading(false);
        return;
      }

      const email = u.email ?? "";
      // Check Firestore-backed whitelist collection for allowed emails.
      const isAllowed = async (e: string) => {
        if (!e) return false;
        try {
          const allowedRef = collection(db, "allowedUsers");
          const q = query(allowedRef, where("email", "==", e));
          const snap = await getDocs(q);
          if (!snap.empty) return true;
          // Fallback: check if a doc exists with the email as ID
          const byId = await getDoc(doc(db, "allowedUsers", e));
          return byId.exists();
        } catch (err) {
          console.error("Error checking allowedUsers whitelist:", err);
          return false;
        }
      };

      if (!(await isAllowed(email))) {
        // Sign out disallowed users immediately and set a denied message
        try {
          await firebaseSignOut(auth);
        } catch {
          // ignore
        }
        setUser(null);
        setRole(null);
        setIsAdmin(false);
        setIsModerator(false);
        setDeniedMessage(
          "This portal is for internship candidates only. Access denied.",
        );
        setLoading(false);
        return;
      }

      setUser(u);
      setRole(null);
      setIsAdmin(false);
      setIsModerator(false);

      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        // create a minimal profile with role 'intern' by default
        await setDoc(userRef, {
          uid: u.uid,
          email: u.email || null,
          name: u.displayName || null,
          role: "intern",
        });
      }

      // listen to updates on the user's profile to pick up role and moderator flag
      let didResolveInitialSnapshot = false;
      unsubUser = onSnapshot(
        userRef,
        (docSnap) => {
          const data = docSnap.data() as
            | { role?: string; moderator?: boolean }
            | undefined;
          if (data?.role === "admin") {
            setRole("admin");
            setIsAdmin(true);
          } else {
            setRole("intern");
            setIsAdmin(false);
          }
          setIsModerator(Boolean(data?.moderator));

          if (!didResolveInitialSnapshot) {
            didResolveInitialSnapshot = true;
            setLoading(false);
          }
        },
        () => {
          if (!didResolveInitialSnapshot) {
            setLoading(false);
          }
        },
      );
    });

    return () => {
      if (unsubUser) {
        unsubUser();
      }
      unsub();
    };
  }, []);

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;
    const email = u.email ?? "";
    const check = async (e: string) => {
      if (!e) return false;
      try {
        const allowedRef = collection(db, "allowedUsers");
        const q = query(allowedRef, where("email", "==", e));
        const snap = await getDocs(q);
        if (!snap.empty) return true;
        const byId = await getDoc(doc(db, "allowedUsers", e));
        return byId.exists();
      } catch (err) {
        console.error("Error checking allowedUsers whitelist:", err);
        return false;
      }
    };

    if (!(await check(email))) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // ignore
      }
      throw new Error(
        "This portal is for cyberdude internship candidates only. Access denied.",
      );
    }

    if (u) {
      const userRef = doc(db, "users", u.uid);
      await setDoc(
        userRef,
        {
          uid: u.uid,
          email: u.email || null,
          // name: u.displayName || null,
        },
        { merge: true },
      );
      // Redirect to dashboard after successful sign-in
      try {
        router.push("/dashboard");
      } catch (err) {
        console.warn("Unable to redirect after sign-in:", err);
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);

    if (user) {
      try {
        router.push("/");
      } catch (err) {
        console.warn("Unable to redirect after sign-out:", err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isModerator,
        loading,
        signInWithGoogle,
        signOut,
        deniedMessage,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
