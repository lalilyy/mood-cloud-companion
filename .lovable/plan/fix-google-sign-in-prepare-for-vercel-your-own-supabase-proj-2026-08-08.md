# Fix Google sign-in + prepare for Vercel / your own Supabase project

## What's going wrong

The Google button currently calls the Lovable-managed OAuth broker (`lovable.auth.signInWithOAuth`). That broker is bound to the Lovable Cloud backend, not to the Supabase project in your callback log (`oludkcgcwgelybvcfxkn.supabase.co`). Your log shows Google → Supabase `/auth/v1/callback` → 302 succeeding on **your** Supabase project, but the app never receives or stores that session, so it lands back on `/login` with nothing to show.

Two extra reasons nothing is displayed:
- The login page only shows an error when the sign-in call itself returns one. Errors that Supabase sends back in the URL (`?error=...`, `#error_description=...`) are never read.
- After a full-page OAuth redirect, the code returns before any error can be surfaced, and there is no callback route to report a failure.

## What I'll change

1. **Use standard Supabase Google OAuth**
   Replace the broker call with `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <origin>/auth/callback } })`, so the session is created against whichever Supabase project the app is configured with (Lovable Cloud today, supabase.com on Vercel).

2. **Add a public `/auth/callback` route**
   Waits for the session to be established, reads any `error` / `error_description` from the query string or hash, then redirects to the originally intended page (or `/`). On failure it sends the user back to `/login?error=...` with a readable message instead of a silent bounce.

3. **Real error handling and logging on login/signup**
   - Show OAuth errors returned via URL params on the login and signup pages.
   - Show a clear message for the common misconfigurations ("provider not enabled", "redirect URL not allowed").
   - Console-log the full error object (and a toast) so failures are visible in the browser console for debugging.
   - Keep a loading state on the Google button so a stuck redirect is obvious.

4. **Preserve the intended destination**
   Store the sanitized same-origin path the user wanted before sign-in and navigate there only after the session is confirmed.

5. **Vercel + supabase.com deployment setup**
   - Add `vercel.json` and switch the build target so the app builds as a Vercel-compatible server bundle instead of the Cloudflare default.
   - Document the environment variables Vercel needs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or anon key), plus the server-side equivalents used by server functions.
   - Add a short `DEPLOYMENT.md` with the exact redirect URLs to whitelist in your Supabase project (Auth → URL Configuration: Site URL + `https://<your-vercel-domain>/auth/callback`) and in the Google OAuth client.

## Technical notes

- Files touched: `src/hooks/use-auth.ts`, `src/routes/login.tsx`, `src/routes/signup.tsx`, new `src/routes/auth.callback.tsx`, new `vercel.json`, new `DEPLOYMENT.md`, `vite.config.ts` (nitro preset).
- `src/integrations/lovable/*` and `src/integrations/supabase/client.ts` are auto-generated and stay untouched; the app keeps reading its Supabase URL/key from env, so the same code works on Lovable Cloud and on your own project.
- Note: inside the Lovable editor preview, standard Supabase OAuth opens a full-page redirect rather than the broker popup. That is expected; the published/Vercel app is unaffected.
- Google must be enabled as a provider in your own Supabase project's Auth settings — the app cannot enable it for you there.
