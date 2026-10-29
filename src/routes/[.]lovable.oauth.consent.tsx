import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame } from "lucide-react";

type ConsentDetails = Awaited<ReturnType<typeof fetchDetails>>;

async function fetchDetails(authorizationId: string) {
  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error) throw error;
  return data;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // SSR has no localStorage session and would redirect signed-in users.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("This authorization request is missing its ID. Start the connection again from the client.");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const data = await fetchDetails(authorizationId);
    // An immediate redirect result (already authorized) carries no client — follow it.
    if (data && "redirect_url" in data) throw redirect({ href: data.redirect_url });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <ConsentShell>
      <h1 className="text-lg font-semibold">Can't load this connection request</h1>
      <p className="text-sm text-muted-foreground mt-2">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <p className="text-sm text-muted-foreground mt-3">Close this window and start the connection again from your assistant or app.</p>
    </ConsentShell>
  ),
});

function scopeLabel(scope: string): string {
  const known: Record<string, string> = {
    openid: "Verify your identity",
    email: "Share your email address",
    profile: "Share your basic profile",
  };
  return known[scope] ?? `Additional permission requested: ${scope}`;
}

function ConsentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-foreground" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-sm card-elevated rounded-2xl border border-border/60 p-6 space-y-4">{children}</div>
    </div>
  );
}

function Consent() {
  const details = Route.useLoaderData() as NonNullable<ConsentDetails>;
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const info = details && "client" in details ? details : null;
  const clientName = info?.client?.name ?? "an app";
  const rawScopes: string = info?.scope ?? "";
  const scopes = rawScopes.trim() ? rawScopes.trim().split(/\s+/) : ["openid", "email", "profile"];
  const redirectUri: string | undefined = info?.redirect_uri;

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await supabase.auth.oauth.approveAuthorization(authorization_id)
      : await supabase.auth.oauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <ConsentShell>
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
          <Flame className="size-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">Connect {clientName} to Punch</h1>
          <p className="text-xs text-muted-foreground">Show up. Every day.</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        This lets <span className="text-foreground font-medium">{clientName}</span> use Punch as you — reading and updating
        your tasks, food, activity and reports while you are signed in.
      </p>

      <div className="space-y-1.5 text-sm">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">It will be able to</p>
        <ul className="space-y-1">
          <li className="flex items-start gap-2"><span className="text-accent">•</span> See and mark your daily tasks</li>
          <li className="flex items-start gap-2"><span className="text-accent">•</span> Add tasks to your routine</li>
          <li className="flex items-start gap-2"><span className="text-accent">•</span> Log your food and workouts</li>
          <li className="flex items-start gap-2"><span className="text-accent">•</span> Read your daily summaries and goals</li>
        </ul>
        {scopes.length > 0 && (
          <ul className="space-y-1 pt-1">
            {scopes.map((s) => (
              <li key={s} className="text-xs text-muted-foreground">{scopeLabel(s)}</li>
            ))}
          </ul>
        )}
      </div>

      {redirectUri && (
        <p className="text-[11px] text-muted-foreground break-all">
          Data will be sent to <span className="text-foreground">{redirectUri}</span>
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        This does not bypass Punch's permissions or backend policies.
      </p>

      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(true)}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(false)}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border transition-all hover:border-primary/50 disabled:opacity-50"
        >
          Cancel connection
        </button>
      </div>
    </ConsentShell>
  );
}
