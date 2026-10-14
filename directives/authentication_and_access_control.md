# Directive: Authentication & Access Control

## Goal
Enforce secure, stateless role-based session management, prevent navigation redirect loops, and manage nursery staff accounts with administrative oversight.

## When this fires
- Implementing or modifying login flows, password hashing, or cookie handling in `src/app/login/` or `src/lib/auth.ts`.
- Restricting routes, API endpoints, or modal dialogs by user role (`admin` vs `staff`).
- Adding, editing, or revoking staff access credentials in `src/components/ProfilePanel.tsx`.
- Diagnosing authentication redirects or HTTP 307 loops.

## Inputs
- `iron-session` encrypted session options (`src/lib/auth.ts`):
  - Cookie name: `nursery_session`
  - TTL: 7 days
  - `SESSION_SECRET` environment variable
- User entity (`src/lib/db/schema.ts`):
  - `id`, `username`, `passwordHash` (bcrypt), `role` (`admin` | `staff`), `active`.

## Git Safety (If Modifying Code)
- Always branch first (`feat/auth-<name>` or `fix/auth-<name>`).
- Never commit sensitive secrets, test credentials, or cookie salts to git.
- Explicit user permission required before merging into `main`.

## Tools / Scripts to Use
- Admin account bootstrap script: `npm run seed:admin -- <username> <password>`.
- Type check: `python execution/run_typecheck.py`.
- Health check: `python execution/verify_project_health.py`.

## Outputs
- Secure, tamper-proof HTTP-only cookie sessions.
- Role-gated interface views (staff view personal invoices; admin views settings, analytics, and staff administration).

## Edge Cases & Error Handling
- **HTTP 307 Redirect Loops**:
  - When redirecting unauthenticated users to `/login`, normalize the path to avoid recursive locale redirects (e.g. infinite redirection between `/login` and localized paths).
  - Check session status before triggering client-side router redirects.
- **Deactivated Accounts**:
  - Immediately invalidate active sessions if an admin marks a user account as inactive in `ProfilePanel.tsx`.
