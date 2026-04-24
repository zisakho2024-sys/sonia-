import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";

export type AuthState = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
};

/**
 * Temporary email-based admin bypass. These accounts are treated as admins
 * regardless of the has_role() RPC result. Useful while RLS / role rows are
 * being set up. Remove once the user_roles table is verified.
 */
const ADMIN_EMAIL_BYPASS = new Set([
  "zisakho2024@gmail.com",
  "buso786786@gmail.com",
]);

/**
 * Hook: subscribes to Supabase auth state and resolves the current
 * user's admin role via the public.has_role() RPC.
 *
 * Pattern note: we set the listener BEFORE calling getSession() to avoid
 * dropping the initial event.
 */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const checkRole = async (uid: string | undefined, email: string | undefined) => {
      if (!uid) {
        if (active) setIsAdmin(false);
        return;
      }
      // Email-based bypass (temporary)
      if (email && ADMIN_EMAIL_BYPASS.has(email.toLowerCase())) {
        if (active) setIsAdmin(true);
        return;
      }
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: uid,
        _role: "admin",
      });
      if (!active) return;
      if (error) {
        console.error("[auth] has_role failed:", error.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(Boolean(data));
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) return;
      setSession(s);
      // Defer the RPC to avoid running inside the auth callback.
      setTimeout(() => checkRole(s?.user.id, s?.user.email), 0);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!active) return;
      setSession(s);
      checkRole(s?.user.id, s?.user.email).finally(() => {
        if (active) setLoading(false);
      });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, isAdmin, loading };
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/admin/login` },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
