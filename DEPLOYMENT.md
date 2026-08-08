# Deploying to Vercel with your own Supabase project

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

Client (must be `VITE_` prefixed, they are inlined at build time):

- `VITE_SUPABASE_URL` — `https://<your-project-ref>.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — your project's publishable (anon) key

Server (used by server functions during SSR):

- `SUPABASE_URL` — same URL
- `SUPABASE_PUBLISHABLE_KEY` — same publishable/anon key
- `SUPABASE_SERVICE_ROLE_KEY` — only if you add privileged server-side code

Set them for Production, Preview and Development.

## 2. Build

The build target is auto-detected: Nitro sees Vercel's environment and emits a
Vercel build output in `.vercel/output`. `vercel.json` pins the commands.

```
npm run build
```

## 3. Supabase Auth configuration (Dashboard → Authentication)

- **URL Configuration → Site URL**: `https://<your-domain>`
- **URL Configuration → Redirect URLs**, add:
  - `https://<your-domain>/auth/callback`
  - `https://<your-project>-*.vercel.app/auth/callback` (preview deployments)
  - `http://localhost:8080/auth/callback` (local dev)
- **Providers → Google**: enable it and paste your Google OAuth client ID +
  secret. Sign-in fails with "provider is not enabled" until this is done.

## 4. Google Cloud Console → Credentials → OAuth client

- **Authorized JavaScript origins**: `https://<your-domain>`
- **Authorized redirect URI**:
  `https://<your-project-ref>.supabase.co/auth/v1/callback`

That Supabase callback URL is what Google redirects to; Supabase then redirects
to the app's `/auth/callback`, which finalizes the session.

## 5. Troubleshooting

- Bounced back to `/login` with a message → the message comes from Supabase or
  Google; the full error object is also logged to the browser console under
  `[auth]`.
- Bounced back with "no session was returned" → the redirect URL is not in the
  Supabase allow-list, or the Site URL points at a different domain.
- Nothing happens on click → check the console for a `signInWithOAuth` error.
