import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAuthError, storePostAuthRedirect } from "@/lib/auth-errors";
import type { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) logAuthError("signInWithPassword", error);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) logAuthError("signUp", error);
    return { error };
  };

  /**
   * Standard Supabase Google OAuth so the session is created against whichever
   * Supabase project this app is configured with (Lovable Cloud or your own).
   */
  const signInWithGoogle = async (redirectTo?: string) => {
    if (redirectTo) storePostAuthRedirect(redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) logAuthError("signInWithOAuth(google)", error);
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) logAuthError("signOut", error);
  };

  return { user, session, isLoading, signIn, signUp, signInWithGoogle, signOut };
}
