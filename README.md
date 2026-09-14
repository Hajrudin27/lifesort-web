# LifeSort Web

The public website and administration companion for [LifeSort](https://github.com/Hajrudin27/LifeSort), a personal-organisation mobile app under active development.

**TypeScript · Next.js 16 App Router · React 19 · Tailwind CSS 4 · Supabase / PostgreSQL**

This repository contains more than a landing page: it includes waitlist and support workflows, protected admin screens, content management and scheduled operational endpoints. It is a separate web application, not a browser port of the React Native app.

## What exists today

| Area | Implemented surface |
| --- | --- |
| Public site | Product/module pages, FAQ, support, privacy, terms and security information |
| Waitlist | Signup endpoint, email-confirmation flow and admin management |
| Support | Ticket submission, admin updates and email replies |
| Administration | Role-based access, activity history, food/price/recipe and health-reference content screens |
| Operations | Data-retention and weekly-digest endpoints, Sentry integration, security headers and CSP configuration |

These are code paths present in the repository. Their presence does not establish a live deployment, production data quality or that all LifeSort mobile features are complete. Product-page copy is not an implementation checklist for the mobile app.

## Engineering details

- **Server checks accompany the UI.** `lib/admin-auth.ts` validates the Supabase user and looks up the role in `admin_users`; privileged route handlers use server-side checks. Client-side visibility alone is not an authorisation boundary.
- **Separate Supabase clients.** Browser, session-aware server and service-role clients live under `lib/supabase/`. The service-role key is server-only and bypasses RLS, so each privileged operation still needs an explicit access check.
- **Shared rate-limit counters.** `lib/rate-limit.ts` uses a PostgreSQL RPC so counters can be shared between server instances. Most database errors deny requests, but a missing RPC (`PGRST202`) explicitly allows them. Apply and verify the rate-limit migration before treating the protection as active.
- **Privacy-aware operations.** Email masking/audit identifiers, retention logic and observability helpers exist in `lib/`. Masking or hashing is not a guarantee of anonymisation. Review data capture and retention settings before using real records.
- **Database checks.** `supabase/tests/` contains pgTAP tests for admin roles and trip-sharing RLS. These cover selected policies, not the entire web application.

## Local development

Prerequisites: Node.js 20.9+ and npm, plus a separate development Supabase environment for data-backed routes.

```bash
npm ci
cp .env.example .env.local
```

Fill `.env.local` with your development values:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged database operations |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Email workflows; use a development sender you control |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG` | Optional observability configuration |
| `CRON_SECRET` | Authentication for scheduled endpoints |

Any `NEXT_PUBLIC_*` value can reach the browser. Never put the service-role key, Resend key or cron secret in those variables or in committed files. Do not copy production secrets into a portfolio demo.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Data-backed routes require the expected schema, auth configuration and credentials. Email actions can send real messages when configured; use synthetic users and test addresses during development.

The repository includes `supabase/config.toml`, migrations and selected pgTAP tests. The mobile repository now contains additional migrations: the two migration directories are not a guarantee of identical current schemas. Review their ordering and compatibility when provisioning a fresh development backend. The local config references `supabase/seed.sql`, which is not committed, so a complete one-command local reset is not established here.

## Checks

```bash
npm run lint
npm run build
```

After a successful build, `npm start` serves the production build locally. A build checks compilation and static rendering; it does not exercise login, database permissions, email delivery or cron behaviour.

There is no application unit-test script, browser end-to-end suite or GitHub Actions workflow committed. For the SQL policy tests, use `supabase test db` only with a prepared disposable local Supabase stack; Docker, the Supabase CLI and the migrated schema are prerequisites.

## Deployment configuration

`vercel.json` configures `/api/cron/weekly-digest` on Mondays at 08:00 UTC and `/api/cron/data-retention` daily at 03:00 UTC. The code also includes Vercel Analytics and Sentry integration. This describes repository configuration, not verification that a deployment or scheduled run exists.

Before hosting, verify environment variables, email sender ownership, Supabase auth redirects and schema state. `lib/site-config.ts` still marks the public origin as a TODO; links and metadata should be reviewed against the domain actually used. Account-deletion hosting and mobile public URLs also need coordination with the LifeSort repository.

## Project structure

```text
app/                    Public pages, protected admin pages and API routes
components/, hooks/     UI components and interaction helpers
lib/                    Auth, validation, rate limits, privacy and data helpers
lib/supabase/           Browser, server-session and privileged clients
proxy.ts                Admin request/session and CSP handling
supabase/migrations/    Database schema and access-control history
supabase/tests/         Selected pgTAP policy regressions
vercel.json             Scheduled endpoint configuration
```

## Current limitations

This is an evolving companion project. It is useful evidence of web integration and administration work, but the mobile app and C# projects carry the stronger architecture and algorithm stories. Missing integration coverage, incomplete standalone backend setup and unverified deployment state should be resolved before presenting this as a production-ready service.
