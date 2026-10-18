"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { hueFromId } from "@/lib/hue";
import { isPreviewMode, exitPreviewMode } from "@/lib/preview";
import { PREVIEW_USER_ID } from "@/lib/repositories/mock";
import { userRepository } from "@/lib/repositories";
import type { User } from "@/types";

interface AuthState {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  isPreview: boolean;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Re-fetches the profile (e.g. after completing onboarding) - the
   * provider only fetches it automatically on sign-in/mount, so any
   * change made outside of that (like onboarding) needs this called
   * explicitly or RequireAuth would keep reading the stale value. */
  refreshProfile: () => Promise<void>;
}

// A session object that only ever needs to look truthy to the rest of
// the app (RequireAuth, BottomNav) - preview mode never talks to
// Supabase, so this doesn't need to satisfy the real Session shape
// beyond what those two call sites read.
const PREVIEW_SESSION = { user: { id: PREVIEW_USER_ID } } as unknown as Session;

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  async function loadProfile(userId: string) {
    const found = await userRepository.get(userId);
    if (found) setProfile(found);
  }

  useEffect(() => {
    if (isPreviewMode()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(PREVIEW_SESSION);
      setProfile({
        id: PREVIEW_USER_ID,
        name: "You",
        hue: hueFromId(PREVIEW_USER_ID),
        onboardedAt: new Date().toISOString(),
      });
      setLoading(false);
      setIsPreview(true);
      return;
    }

    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession) await loadProfile(newSession.user.id);
        else setProfile(null);
      }
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string, name: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error: error?.message ?? null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    if (isPreviewMode()) {
      exitPreviewMode();
      setSession(null);
      setProfile(null);
      setIsPreview(false);
      return;
    }
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (isPreviewMode()) return;
    if (session) await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        isPreview,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
