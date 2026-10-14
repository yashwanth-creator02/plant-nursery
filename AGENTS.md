# Agent Rules & Instructions

You operate within a 3-layer architecture that separates concerns to maximize reliability. LLMs are probabilistic, whereas business logic is deterministic and requires consistency. This system fixes that mismatch.

## The 3-Layer Architecture

**Layer 1: Directives (What to do)**
- Standard Operating Procedures (SOPs) written in Markdown, located in `directives/`
- Define the goals, triggers, inputs, tools/scripts to use, outputs, and edge cases
- Current project directives include:
  - `directives/git_workflow.md`: Branch safety, merge gates, and testing constraints
  - `directives/bilingual_localization.md`: Kannada and English translation guidelines & overflow prevention
  - `directives/invoice_and_billing.md`: Invoicing lifecycle, atomic stock deductions, printable layout
  - `directives/stock_and_gallery_management.md`: Inventory categorization, Supabase photo storage, gallery
  - `directives/sales_analytics.md`: Financial analytics calculations, visualizations, and exports
  - `directives/business_profile_and_invoice_settings.md`: Business header details, GST rates, invoice sequencing
  - `directives/authentication_and_access_control.md`: Role-based access, cookie security, 307 loop prevention


**Layer 2: Orchestration (Decision making)**
- This is the agent. Intelligent routing, intent-to-execution mapping, error recovery.
- Read directives, call execution tools in the correct order, handle errors, ask for clarification, and update directives with learnings.

**Layer 3: Execution (Doing the work)**
- Deterministic Python and TypeScript scripts located in `execution/` and `scripts/`
- Environment variables and credentials stored securely in `.env`
- Reliable, testable, fast tools for data migrations, type checks, and project health audits.

---

## Operating Principles

**1. Check for tools first**
Before writing custom code or scripts, check `execution/` and `scripts/` per the active directive. Only write new tools if none exist.

**2. Self-anneal when things break**
- Read the error message and stack trace.
- Fix the underlying tool or component and re-test.
- Update the relevant directive in `directives/` with the discovered constraints or edge cases.

**3. Update directives as you learn**
Directives are living documents. When discovering API constraints, better patterns, common layout traps (e.g. Kannada text width), or performance limits, update the directive.

**4. Anti-Vibecoding & Aesthetics Standards**
- **Zero emojis**: Never use emojis anywhere in UI, code, logs, comments, commit messages, terminal outputs, or documentation. Zero exceptions.
- **Zero glowing or pulsing dots**: Never use neon green dots, pulsing indicator pips, or AI "agent active" dots.
- **Zero pill-type labels or badges**: Avoid arbitrary pill-shaped labels or floating pill badges unless explicitly requested by the user.
- **Eliminate AI "vibecoded" cliches**: Reject generic SaaS tropes (decorative blur rings, cookie-cutter purple/neon gradients, meaningless marketing fluff badges). Focus on authentic, functional craft.
- **Theme Integrity**: Preserve the plant nursery's custom earthy/pine color palette and typography (do not overwrite with external brand themes unless explicitly instructed).

**5. Git Workflow & Branch Safety**
- **Always create a new git feature branch before implementing any new feature, refactor, or enhancement.**
- Standard branch naming convention:
  - `feat/<feature-name>` for new features
  - `experiment/<experiment-name>` for prototypes
  - `fix/<bug-name>` for bug fixes
- Develop and verify changes on the feature branch before merging back to `main`.
- **Never merge a feature branch into `main` without explicit user permission.** Always keep work on the feature branch until the user explicitly asks to merge.
- **When authorized to merge, always use `git merge --no-ff <branch-name>`** to ensure an explicit merge commit is created, preserving branch topology in `git log --graph`.

**6. Verification & Testing**
- **Do not perform browser subagent verification or browser automation unless the user explicitly asks for it.**
- Use automated CLI tooling (`execution/run_typecheck.py`, `npx tsc --noEmit`, `npm run lint`) for verification.

**7. Maintain Documentation**
- Keep `README.md` and `directives/` updated as project capabilities and architecture evolve.

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
