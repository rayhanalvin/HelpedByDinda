# Helped By Dinda - Project Rules

## Scope

These rules apply to all work in the Helped By Dinda workspace.

## Source of Truth

- Read `PRD_Helped_By_Dinda.md` before planning or changing project code.
- Treat the PRD as the product source of truth, while treating the existing codebase as the source of truth for current implementation conventions.
- Do not assume a file, dependency, route, environment variable, database table, or integration exists until it has been inspected or created.
- Keep all user-facing dummy data in Indonesian and relevant to the tutoring context. Never use Lorem Ipsum.
- Preserve existing user changes. Do not reset, overwrite, or remove unrelated work.

## Execution Model

- Work in the phases and task order defined in section 11 of the PRD.
- Start with Phase 1 and Task 1.1 unless the user explicitly requests another task.
- Do not implement multiple phases in one turn.
- Complete one phase as a coherent milestone, then stop and report before starting the next phase.
- At the end of each phase, report:
  1. completed tasks;
  2. created or changed files;
  3. commands to run and verification steps;
  4. blockers, assumptions, and known gaps.
- After the phase report, wait for explicit user confirmation before continuing to the next phase.
- Do not create placeholder pages or "under development" screens. Every requested page must have a complete UI in Phase 1 or real data and behavior in later phases.
- Prefer small, reversible edits. After every substantive edit, run the narrowest relevant validation before expanding scope.
- Before editing, identify the controlling code path, one falsifiable local hypothesis, and one cheap check that could disconfirm it.

## Product and UX Requirements

- Product: Helped By Dinda, a modern digital tutoring platform for Admin, Pengajar, and Murid.
- Build mobile-first responsive interfaces. Validate at approximately 375px and desktop widths.
- Use the PRD design tokens: violet primary `HSL(262, 83%, 58%)`, emerald accent `HSL(158, 64%, 42%)`, soft cool background, and accessible contrast.
- Use Plus Jakarta Sans for headings, Inter for body text, and tabular/monospace numerals for financial and statistical values when practical.
- Prefer Lucide icons and existing shadcn/ui patterns when those dependencies are present.
- Keep touch targets at least 44px. Tables must become readable card/list layouts on narrow screens rather than forcing painful horizontal scrolling.
- Use clear Indonesian copy: professional, warm, and grounded. Use "Anda" for adult users and "Kamu" for student-facing motivation.
- Use meaningful loading, empty, error, success, and disabled states. Do not hide important actions behind unexplained icons; provide accessible labels and tooltips where needed.
- Use subtle motion only where it supports hierarchy and feedback. Respect reduced-motion preferences.
- Do not introduce unrelated redesigns, excessive gradients, decorative clutter, or card-within-card layouts.

## Required Technical Direction

- Follow the PRD stack: Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Clerk, Neon PostgreSQL, Drizzle ORM, Bunny Stream/CDN, Resend or SMTP, Midtrans Snap, and Vercel Cron.
- Reuse existing project patterns before adding abstractions or libraries.
- Keep server-only code, secrets, payment credentials, email credentials, and database access out of client components and browser bundles.
- Use Server Actions for mutations where appropriate and call `revalidatePath` or the established cache invalidation mechanism after successful mutations.
- Validate every Server Action and API input with Zod. Keep validation schemas centralized under the project validation convention, documented in the PRD as `/lib/validations`.
- Enforce authorization on the server for every protected mutation and data query. Never rely on hidden UI controls for access control.
- Use the PRD database schema and enum meanings as the baseline. Preserve Indonesian domain naming where the schema already uses it.
- Use Asia/Jakarta for schedule, attendance, fee, reminder, and payment-period calculations.
- Add or preserve indexes for frequently queried fields and avoid unbounded queries in dashboards.

## Authentication and Roles

- Use Clerk Email & Password authentication with required email verification.
- Synchronize Clerk users into the `users` table through the documented webhook flow; default new users to `murid`.
- Protect `/admin/*`, `/pengajar/*`, and `/murid/*` with middleware and server-side role checks.
- Admin accounts are provisioned by seed or trusted administration, not public self-registration.
- A Pengajar may manage only their own materials and profile data. A Murid may access only their own attendance, payment, schedule, and profile data unless the PRD explicitly permits otherwise.

## Domain Rules

- Attendance is unique per schedule and user. Enforce the database constraint and re-check authorization and time windows server-side.
- Attendance is open from 15 minutes before schedule start through 15 minutes after schedule end; mark late attendance according to the PRD rules.
- Fee totals count only `hadir` and `terlambat` attendance and use the stored hourly rate for the relevant period.
- Payment status changes must come from verified Midtrans notifications or an authorized admin workflow.
- Exam catalog deletion is soft deletion when history must remain available.
- Prevent overlapping schedules for the same Pengajar or Murid.

## Payments, Webhooks, and Email

- Call Midtrans Snap server-side with `MIDTRANS_SERVER_KEY`; expose only the public client key to the browser.
- Verify Midtrans `signature_key` with SHA-512 before changing payment state. Invalid signatures return `401`, are logged, and do not mutate payment data.
- Make webhook handlers idempotent. Repeated notifications must not double-send receipts or corrupt status.
- Store webhook and reminder audit logs according to the PRD.
- Keep email sending server-side, rate-limited, and retryable. Record failed sends with an error message.
- Protect cron endpoints with `CRON_SECRET` and validate webhook/request payloads before processing.

## Security and Privacy

- Never commit `.env`, production secrets, API keys, webhook secrets, or real personal/payment data.
- Sanitize user-authored HTML such as material descriptions before rendering.
- Use least-privilege data access and avoid leaking sensitive fields in public pages, logs, or client props.
- Apply rate limiting to sensitive webhooks, email actions, and other endpoints specified in the PRD.
- Keep public pages indexable only where intended; internal role areas must be `noindex`.

## Verification Checklist

- Run the narrowest relevant typecheck, lint, unit test, or route test after each focused change.
- Before declaring a phase complete, run the project build and relevant tests when the project provides them.
- Verify all new routes render, protected routes enforce roles, forms expose validation errors, and mutations show success/failure feedback.
- Check mobile layout, keyboard access, focus states, semantic labels, and color contrast for changed UI.
- For payment or webhook changes, test valid, invalid, duplicate, expired, and failure paths without using real credentials.
- Do not claim a task is complete when it was only scaffolded; report partial implementation explicitly.

## Communication

- Respond to the user in Indonesian unless the user requests another language.
- Keep progress updates concise and concrete.
- When blocked, explain the exact missing input or prerequisite and provide the smallest actionable next step.
- At the end of a phase, stop after the report and wait for confirmation; do not begin the next phase automatically.
