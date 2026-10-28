# Agent Rules & Instructions

## Project Overview

This repository is the Sri Vijayalakshmi Nursery internal management application: a
Next.js App Router application for inventory, billing, printable invoices, staff
access, sales analytics, and full nursery data export.

Primary workflows:

- Create and finalize bilingual (English/Kannada) invoices with atomic stock deduction.
- Manage stock items, categories, subcategories, photos, and nursery gallery content.
- Review sales analytics and cash/online drawer totals.
- Configure the business header, GST rates, invoice sequence, logo, signature, and QR code.
- Export a complete structured backup of nursery data.

The application is not a vanilla JavaScript MPA and does not use Firebase, Vite, or
Anonymous Auth. Treat the existing Next.js, Drizzle, Supabase, and iron-session
architecture as authoritative.

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript 5
- Tailwind CSS v4 and Lucide icons
- Drizzle ORM 0.45 with Supabase Postgres
- `iron-session` encrypted cookie sessions
- Zod request validation
- Supabase Storage for stock photos and signatures
- Python execution scripts for type checks and project health audits

## The 3-Layer Architecture

### Layer 1: Directives (What to do)

Standard Operating Procedures live in `directives/`. Each directive defines the goal,
triggers, inputs, tools or scripts, outputs, and edge cases. Read the relevant
directive before changing a business workflow.

Current directives:

- `directives/git_workflow.md`: Branch safety, merge gates, and testing constraints
- `directives/bilingual_localization.md`: Kannada and English translation guidelines and overflow prevention
- `directives/invoice_and_billing.md`: Invoicing lifecycle, atomic stock deductions, printable layout
- `directives/stock_and_gallery_management.md`: Inventory categorization, Supabase photo storage, gallery
- `directives/sales_analytics.md`: Financial analytics calculations, visualizations, and exports
- `directives/business_profile_and_invoice_settings.md`: Business header details, GST rates, invoice sequencing
- `directives/authentication_and_access_control.md`: Role-based access, cookie security, 307 loop prevention
- `directives/data_backup_and_export.md`: Full nursery data backup, nested schema export, admin download gate

### Layer 2: Orchestration (Decision making)

The agent is the orchestration layer. Route intent to the correct directive, call
execution tools in the right order, handle errors, ask for clarification when a
business decision is ambiguous, and update directives with new constraints.

### Layer 3: Execution (Doing the work)

Deterministic Python and TypeScript tools live in `execution/` and `scripts/`.
Credentials and environment values live in `.env` and must never be committed.

- `execution/run_typecheck.py`: Runs `tsc --noEmit`
- `execution/verify_project_health.py`: Checks project architecture and gitignore health
- `scripts/`: Seed, migration, translation, storage, and verification utilities

## Repository Map

- `src/app/`: App Router pages and API routes (`api/`, `invoice/`, `invoices/`, `stock/`, `gallery/`, `login/`)
- `src/components/`: Invoice editor, stock picker, modals, analytics, profile, and shell components
- `src/db/`: Drizzle client and schema
- `src/lib/`: Auth, session, language context, translations, Supabase storage, shared types
- `directives/`: Layer 1 SOPs
- `execution/`: Deterministic validation and health scripts
- `scripts/`: CLI maintenance and migration scripts
- `.agents/skills/` and `.agent/skills/`: Local, gitignored skill copies synced from `brand-leo-utils`

## Developer Commands

```bash
npm run dev                 # Start Next.js on 0.0.0.0
npm run build               # Production build
npm run start               # Start production server
npm run lint                # ESLint
npm run db:generate         # Generate Drizzle migration SQL
npm run db:push             # Push schema changes to Postgres
npm run db:studio           # Open Drizzle Studio
npm run seed:admin -- <user> <pass>
python execution/run_typecheck.py
python execution/verify_project_health.py
```

Prefer the existing scripts over ad-hoc replacements. If a required tool does not
exist, add a small deterministic script under `execution/` or `scripts/` and document
it in the relevant directive.

## Environment

Copy `.env.example` to `.env` and fill in the values. Required for normal operation:

- `DATABASE_URL`: Supabase Postgres connection string
- `SESSION_SECRET`: Random string, 32 characters or longer

Optional Supabase storage and translation values are listed in `.env.example`.
Never commit `.env`, service-role keys, database passwords, or session secrets.
Never edit files inside the npm cache.

## Operating Principles

### 1. Check for tools first

Before writing custom code or a new script, check `execution/` and `scripts/` and the
active directive. Only add a tool when no existing tool covers the job.

### 2. Self-anneal when things break

Read the error message and stack trace, fix the underlying component or tool, and
re-test. When the failure reveals a durable constraint, update the relevant directive
instead of leaving the knowledge only in the chat.

### 3. Update directives as you learn

Directives are living documents. Record API constraints, layout traps (especially
Kannada text width and print overflow), data-integrity rules, and better patterns as
they are discovered.

### 4. Load the right skill

When a task matches an available skill, load it before acting. Skills are operational
instructions, not optional reading. If a skill is missing or stale, use the
`brand-skill-sync` workflow to update it from `brand-leo-utils`.

### 5. Maintain documentation

Keep `README.md` and `directives/` aligned with actual behavior when capabilities or
architecture change. There is no `docs/FILE_INVENTORY.md` in this repository today;
create a `docs/` file only when it serves a real need, and then keep it current.

### 6. Run `/populate` after major work

After a substantial feature, refactor, migration, or debugging session, run the
`populate` workflow to extract durable project instructions, architectural decisions,
domain rules, and user preferences into the appropriate directive or project document.
Do not use it to store transient task notes.

### 7. Close substantive work with "What I Gained"

End substantive sessions with a short `What I Gained` section covering:

- What changed and where
- What was verified, and what remains unverified
- New constraints, gotchas, or follow-up work
- Any directive or documentation updates that were made

Keep it factual. Do not claim a build, test, or browser check passed unless it did.

### 8. Use discernment nudges

After a substantive answer or draft that the user may act on, use the
`discernment-nudge` skill to add a small number of specific follow-up questions that
help the user check facts, probe assumptions, or notice missing context. This project
does not impose a hard one-per-session cap, but do not repeat the same nudge or turn it
into nagging. Skip it for trivial lookups, pure formatting or file assembly, creative
writing, and code the user will run directly.

### 9. Bootstrap worktrees honestly

This repository has no `execution/setup_worktree.py` and no `.dev-port` registry.
When using a git worktree, create it with normal git commands, then restore the
gitignored local state manually:

```bash
git worktree add ../plant-nursery-<name> -b feat/<name>
cd ../plant-nursery-<name>
npm install
```

Copy `.env`, `.agents/skills/`, `.vercel/`, and `.tmp/` only when needed. Never commit
those files. Do not claim a worktree is ready until dependencies and environment
values are present and `python execution/run_typecheck.py` succeeds.

### 10. Confirm resource release

Before closing a long-running task, report:

```text
Resources received: <files, credentials, or context supplied>
Resources released: <temporary files, servers, or sessions stopped>
Resources retained: <files or state intentionally kept>
```

Keep the report short and do not expose secret values.

### 11. Anti-Vibecoding & Aesthetics Standards

- **Zero emojis**: Never use emojis in UI, code, logs, comments, commit messages,
  terminal output, or documentation. Zero exceptions.
- **Zero glowing or pulsing dots**: No neon green dots, pulsing indicator pips, or
  "agent active" dots.
- **Zero pill-type labels or badges**: Avoid arbitrary pill-shaped labels or floating
  pill badges unless the user explicitly asks for them.
- **Eliminate AI "vibecoded" cliches**: Reject decorative blur rings, cookie-cutter
  purple or neon gradients, and meaningless marketing badges. Favor functional craft.
- **Zero redundant badges**: In role-restricted interfaces, do not repeat "Admin Only"
  labels on every internal card.
- **Single action controls**: Avoid duplicate buttons that perform the same operation.
- **Theme integrity**: Preserve the nursery's earthy/pine palette and typography.
  The printable invoice uses the established dark blue `#1b365d` ink.

### 12. Git Workflow & Branch Safety

- Always create a feature branch before implementing a new feature, refactor, or
  enhancement.
- Branch naming: `feat/<feature-name>`, `experiment/<experiment-name>`, or
  `fix/<bug-name>`.
- Develop and verify on the feature branch before merging to `main`.
- Never merge a feature branch into `main` without explicit user permission.
- When authorized to merge, use `git merge --no-ff <branch-name>` so the merge commit
  and branch topology are preserved.
- Do not rewrite history or force-push a shared branch.

### 13. Verification & Testing

- Do not perform browser subagent verification or browser automation unless the user
  explicitly asks for it.
- Use automated CLI tooling: `python execution/run_typecheck.py`,
  `python execution/verify_project_health.py`, `npm run lint`, and `npm run build`.
- Report pre-existing lint failures separately from new failures. Do not hide a new
  error inside a noisy baseline.
- For invoice, stock, or auth changes, verify the relevant transaction and permission
  paths in code even when a full browser test is out of scope.

## Security, Privacy & Data Integrity

- Keep `.env`, session secrets, database URLs, service-role keys, and customer data out
  of commits, logs, screenshots, and documentation.
- Finalized invoices are immutable. Preserve `headerSnapshot`, line-item snapshots,
  totals, signatures, and stock deduction behavior.
- Stock deduction must remain atomic inside a database transaction. A failed
  finalization must roll back cleanly.
- Do not add a database column or migration for a display-only field without an
  explicit plan and verification. Derive display values where the existing schema is
  sufficient.
- Validate API inputs with Zod and keep role checks on admin-only routes.

## Skill Sources

This project's skills live in `.agents/skills/` (and `.agent/skills/`) and are
gitignored here. The brand-leo-utils repository is the source of truth; the local
folder is a disposable copy owned by whichever agent is handling the session, not one
specific tool.

<!-- brand-leo-utils:skill-sync:start -->
## Skills (brand-leo-utils)

This project's skills live in `.agents/skills/` (and `.agent/skills/`) — gitignored here. The
brand-leo-utils repo is the source of truth; this folder is a disposable
local copy, and it belongs to whichever agent is handling the session,
not one specific tool.

- To load or refresh skills from brand-leo-utils, follow its
  `directives/instantiate_project_skills.md`.
- To update or migrate this project to the latest brand version, follow its
  `directives/update_project_from_brand.md`.
- If you create or edit a skill under `.agents/skills/`, it isn't done
  until it's synced back: follow brand-leo-utils's
  `directives/sync_skill_to_brand.md`. Both directives branch first,
  never commit to main/master directly, and only reach main via a
  pull request or an explicit, separate go-ahead from the user.
<!-- brand-leo-utils:skill-sync:end -->
