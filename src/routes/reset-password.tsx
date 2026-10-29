import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { oauthReturnPath } from "@/lib/oauth-return-path";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flame, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Punch" },
      { name: "description", content: "Choose a new password for your Punch account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Give the auth client a moment to detect the recovery session from the email link.
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getUser();
      setHasSession(!!data.user);
      setReady(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const submit = async () => {
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const { error: e } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setDone(true);
    // Return to a preserved connection request (consent flow) if one was stashed.
    let target = "/";
    try {
      const stored = sessionStorage.getItem("punch-oauth-next");
      if (stored) target = oauthReturnPath(stored);
      sessionStorage.removeItem("punch-oauth-next");
    } catch {
      // sessionStorage unavailable — return to the app.
    }
    setTimeout(() => router.history.push(target), 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-foreground"
         style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-sm card-elevated rounded-2xl border border-border/60 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
            <Flame className="size-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Set a new password</h1>
        </div>

        {!ready ? (
          <p className="text-sm text-muted-foreground">Checking your reset link…</p>
        ) : !hasSession ? (
          <p className="text-sm text-muted-foreground">
            This link has expired or was already used. Request a new reset email from the sign-in page.
          </p>
        ) : done ? (
          <p className="text-sm text-success">Password updated! Taking you to the app…</p>
        ) : (
          <>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button className="w-full" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Update password
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
