<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- All user data (profile/goal, tasks, food, activity) lives in Lovable Cloud tables (profiles, tasks, food_entries, activity_entries) scoped by RLS to the signed-in user; the localStorage copies are only read once to migrate an existing device's data into the account on first sign-in, never treated as the source of truth. Why: the app has per-user accounts and data must follow the login across devices.
- Route structure: "/" lives at src/routes/_authenticated/index.tsx behind the integration-managed auth gate (redirects to /auth); /auth and /reset-password are public.
