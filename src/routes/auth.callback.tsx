import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: Callback,
});

function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
  async function finishLogin() {
    const code = new URL(window.location.href).searchParams.get("code");

    if (!code) {
      navigate({ to: "/login", replace: true });
      return;
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Exchange error:", error);
      navigate({ to: "/login", replace: true });
      return;
    }

    navigate({ to: "/", replace: true });
  }

  finishLogin();
}, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Signing you in...
    </div>
  );
}
