import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { consumePostAuthRedirect, friendlyAuthError, logAuthError, readAuthErrorFromUrl } from "@/lib/auth-errors";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — LilyMood" },
      { name: "description", content: "Completing your LilyMood sign-in." },
      { property: "og:title", content: "Signing you in — LilyMood" },
      { property: "og:description", content: "Completing your LilyMood sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fail = (message: string, detail?: unknown) => {
      if (detail) logAuthError("oauth callback", detail);
      if (cancelled) return;
      setError(message);
      window.setTimeout(() => {
        window.location.replace(`/login?error=${encodeURIComponent(message)}`);
      }, 1500);
    };

    const finish = () => {
      const target = consumePostAuthRedirect();
      window.location.replace(target);
    };

    const run = async () => {
      // 1. Provider/Supabase returned an explicit error in the URL.
      const urlError = readAuthErrorFromUrl();
      if (urlError) {
        fail(urlError, urlError);
        return;
      }

      // 2. PKCE code flow — exchange it if the client did not already.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && !/code verifier|already/i.test(error.message)) {
          fail(friendlyAuthError(error.message), error);
          return;
        }
      }

      // 3. Wait briefly for the session (implicit flow parses the hash async).
      for (let attempt = 0; attempt < 20; attempt++) {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          fail(friendlyAuthError(error.message), error);
          return;
        }
        if (data.session) {
          finish();
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 150));
      }

      fail("Sign-in did not complete — no session was returned by the backend.");
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      {error ? (
        <>
          <p className="max-w-sm rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
          <p className="text-sm text-muted-foreground">Taking you back to sign in…</p>
        </>
      ) : (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </>
      )}
    </div>
  );
}
