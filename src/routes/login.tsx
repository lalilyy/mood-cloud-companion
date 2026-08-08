import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { friendlyAuthError, readAuthErrorFromUrl } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, Sun } from "lucide-react";


export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — MoodSky" },
      { name: "description", content: "Sign in to MoodSky to track your mood and weather." },
      { property: "og:title", content: "Sign in — MoodSky" },
      { property: "og:description", content: "Sign in to MoodSky to track your mood and weather." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, isLoading, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Surface OAuth failures that come back as URL params instead of bouncing silently.
  useEffect(() => {
    const urlError = readAuthErrorFromUrl();
    if (urlError) {
      setError(urlError);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: "/", replace: true });
    }
  }, [isLoading, user, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);
    if (error) {
      setError(friendlyAuthError(error.message));
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle("/");
    if (error) {
      setIsGoogleLoading(false);
      setError(friendlyAuthError(error.message));
    }
  };


  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Sun className="h-6 w-6 text-primary" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Cloud className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight text-foreground">
          Welcome back to MoodSky
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Track your mood and the weather each day.
        </p>

        <form onSubmit={handleEmailSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="rounded-xl border-border bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="rounded-xl border-border bg-card"
            />
          </div>
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full py-5 text-base font-semibold"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogle}
          disabled={isGoogleLoading}
          className="mt-6 w-full rounded-full border-border py-5 text-base"
        >
          {isGoogleLoading ? "Redirecting to Google…" : "Continue with Google"}
        </Button>


        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
