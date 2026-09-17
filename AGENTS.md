# Repository Rules

## Git Workflow
- **Always create a new git feature branch before implementing any new feature, refactor, or enhancement.**
- Standard branch naming convention:
  - `feat/<feature-name>` for new features
  - `experiment/<experiment-name>` for prototypes
  - `fix/<bug-name>` for bug fixes
- Develop and verify changes on the feature branch before merging back to `main`.
- **Never merge a feature branch into `main` without explicit user permission.** Always keep work on the feature branch until the user explicitly asks to merge.
- **When authorized to merge, always use `git merge --no-ff <branch-name>`** to ensure an explicit merge commit is created, preserving the branch topology in `git log --graph`.

## Verification & Testing
- **Do not perform browser subagent verification or browser automation unless the user explicitly asks for it.**

<!-- brand-leo-utils:skill-sync:start -->
## Skills (brand-leo-utils)

This project's skills live in `.agent/skills/` — gitignored here. The
brand-leo-utils repo is the source of truth; this folder is a disposable
local copy, and it belongs to whichever agent is handling the session,
not one specific tool.

- To load or refresh skills from brand-leo-utils, follow its
  `directives/instantiate_project_skills.md`.
- If you create or edit a skill under `.agent/skills/`, it isn't done
  until it's synced back: follow brand-leo-utils's
  `directives/sync_skill_to_brand.md`. Both directives branch first,
  never commit to main/master directly, and only reach main via a
  pull request or an explicit, separate go-ahead from the user.
<!-- brand-leo-utils:skill-sync:end -->
