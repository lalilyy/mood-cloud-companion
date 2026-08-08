/** Shared helpers for surfacing auth/OAuth failures instead of silently bouncing. */

const REDIRECT_KEY = "moodsky:post-auth-redirect";

export function readAuthErrorFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const code = query.get("error") ?? hash.get("error") ?? query.get("error_code") ?? hash.get("error_code");
  const description =
    query.get("error_description") ?? hash.get("error_description") ?? query.get("message") ?? hash.get("message");
  if (!code && !description) return null;
  return friendlyAuthError(description ?? code ?? "Sign-in failed.");
}

export function friendlyAuthError(raw: string): string {
  const message = decodeURIComponent(raw.replace(/\+/g, " "));
  const lower = message.toLowerCase();
  if (lower.includes("provider is not enabled") || lower.includes("unsupported provider")) {
    return "Google sign-in is not enabled on the backend yet. Enable the Google provider in your Supabase project's Auth settings.";
  }
  if (lower.includes("redirect") && (lower.includes("not allowed") || lower.includes("invalid"))) {
    return "This app's redirect URL is not allowed by the backend. Add it to Auth → URL Configuration → Redirect URLs.";
  }
  if (lower.includes("access_denied")) {
    return "Google sign-in was cancelled.";
  }
  return message;
}

/** Store a sanitized same-origin path to return to after sign-in. */
export function storePostAuthRedirect(path: string) {
  if (typeof window === "undefined") return;
  if (!path.startsWith("/") || path.startsWith("//")) return;
  window.sessionStorage.setItem(REDIRECT_KEY, path);
}

export function consumePostAuthRedirect(): string {
  if (typeof window === "undefined") return "/";
  const value = window.sessionStorage.getItem(REDIRECT_KEY);
  window.sessionStorage.removeItem(REDIRECT_KEY);
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function logAuthError(context: string, error: unknown) {
  // Keep the full object in the console so OAuth failures are debuggable in prod.
  console.error(`[auth] ${context}`, error);
}
