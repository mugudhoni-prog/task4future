import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { oauthReturnPath } from "@/lib/oauth-return-path";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flame, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Punch" },
      {
        name: "description",
        content: "Sign in to Punch to track your daily tasks, food, activity and reports.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const signInWithProvider = async (provider: "google" | "lovable") => {
    setError("");
    setNotice("");
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    setBusy(false);
    if (result.error) setError(result.error.message);
    // On success with redirect the browser navigates away on its own.
  };

  const submitEmail = async () => {
    setError("");
    setNotice("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    if (mode === "signin") {
      const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (e) {
        setError(e.message);
        return;
      }
      navigate({ to: "/", replace: true });
      return;
    }
    if (mode === "signup") {
      if (password.length < 6) {
        setBusy(false);
        setError("Password must be at least 6 characters.");
        return;
      }
      const { data, error: e } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (e) {
        setError(e.message);
        return;
      }
      if (data.session) {
        navigate({ to: "/", replace: true });
        return;
      }
      setNotice("Account created! Check your email for a confirmation link to finish signing in.");
      return;
    }
    // forgot
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setNotice("Password reset link sent. Check your email.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-foreground"
         style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-sm card-elevated rounded-2xl border border-border/60 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
            <Flame className="size-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Punch</h1>
            <p className="text-xs text-muted-foreground">Show up. Every day.</p>
          </div>
        </div>

        {mode !== "forgot" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(""); setNotice(""); }}
              className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                mode === "signin" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(""); setNotice(""); }}
              className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                mode === "signup" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
              }`}
            >
              Create account
            </button>
          </div>
        )}

        <div className="space-y-2">
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode !== "forgot" && (
            <Input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitEmail()}
            />
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {notice && <p className="text-xs text-success">{notice}</p>}

        <Button className="w-full" onClick={submitEmail} disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {mode === "signin" && "Sign in"}
          {mode === "signup" && "Create account"}
          {mode === "forgot" && "Send reset link"}
        </Button>

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => { setMode("forgot"); setError(""); setNotice(""); }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Forgot password?
          </button>
        )}
        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(""); setNotice(""); }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Back to sign in
          </button>
        )}

        {mode !== "forgot" && (
          <>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <button type="button" className="lovable-auth-button w-full" onClick={() => signInWithProvider("lovable")}>
              Continue with Lovable
            </button>
            <Button variant="outline" className="w-full" onClick={() => signInWithProvider("google")} disabled={busy}>
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.4-1.7 4.1-5.4 4.1-3.3 0-5.9-2.7-5.9-6.1s2.7-6.1 5.9-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 7 2.5 2.9 6.6 2.9 11.6S7 20.7 12 20.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
              </svg>
              Continue with Google
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
