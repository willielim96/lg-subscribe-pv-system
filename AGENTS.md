# LG Commision Calculator

This project uses Next.js, Supabase, GitHub and Vercel. Deliver a minimal working
order and PV tracker first; commissions are a later phase. Preserve the agreed
PV rules and protect customer data. Report deployment and verification status
accurately; prepared configuration does not mean a service is connected.

## Ponytail project rules

Adapted from https://github.com/DietrichGebert/ponytail/blob/main/AGENTS.md
Source blob: ee5d6f1d6c1e4ff197a41d3ff43fa6597dbc81d4.
Copyright (c) 2026 DietrichGebert. MIT license: notices/ponytail-LICENSE.txt.

Solve the whole problem with the least new code. Before writing, read the task
and affected code. Trace callers, tests, fixtures, configuration and exports;
identify data-loss, exposure and compatibility risks.

Choose the first option that fully solves the task:
1. Omit unrequested features and flexibility.
2. Reuse the project's existing helpers, components and conventions.
3. Use standard-library or platform features.
4. Use installed dependencies; do not add a package for a few lines.
5. Write the smallest readable implementation.

Finish all affected parts. Avoid speculative abstractions, wrappers and future
configuration. Preserve existing structure, validation and error handling when
moving code. Prefer correctness on edge cases over a shorter-looking diff.
Comments should explain why, not restate code. Before fixing a shared function,
search its callers and fix the root cause once.

Non-trivial branches, loops, parsers, money calculations and security logic need
a small meaningful test or self-check. Trivial edits do not need new tests.
Mark deliberate limits with `shortcut: <limit>, <when to upgrade>` only when
useful. Never cut trust-boundary validation, data-loss protection, security,
accessibility or requested behavior to reduce code size.

End implementation reports with what was not checked or remains incomplete and
any concrete risk. These project rules do not override user requirements or
higher-priority platform instructions.

## Code organization

Keep app/page.tsx thin: compose feature components, do not put the entire app there.
Keep Supabase client configuration in lib/supabase/client.ts; environment values
belong in ignored .env.local locally and Vercel environment settings when deployed.
Never hardcode credentials or expose privileged keys to client components.
Keep domain types/defaults in lib, authentication UI in its own component, and
state/data orchestration in hooks. Split forms and lists into focused components
when changing those features. Keep database access out of presentation components.
Prefer clear responsibility boundaries over arbitrary file-size limits; avoid
generic repositories or abstractions with no current use. Preserve behavior,
validation and error handling when refactoring, and verify imports and builds.

## Shared workflow (Claude and ChatGPT)

Both assistants change this same GitHub repository. Follow PROJECT_HANDOFF.md section 2:
read the latest code and PROJECT_HANDOFF.md first and never overwrite the other assistant's work;
use a feature branch and Pull Request; test on the Vercel Preview (test Supabase only);
never merge to main or change Production without the owner's explicit confirmation;
save database changes in supabase/migrations and apply them to test first;
never commit secrets or .env files; update PROJECT_HANDOFF.md in every PR that changes
features, business rules or the database.
