# Directive: Git Workflow & Branch Safety

## Goal
Enforce deterministic branch isolation, protect protected branches (`main`/`master`), prevent unapproved merges, and regulate browser automation for all development tasks in the plant nursery project.

## When this fires
- Starting any feature, refactor, enhancement, experiment, or bug fix.
- Finalizing development and preparing changes for merge.
- Whenever running tests or performing verification.

## Inputs
- Current git branch status (`git status`).
- Feature or bug description to determine branch naming.

## Git Safety (If Modifying Code)
- **Always branch first**: Never commit directly to `main` or `master`.
- **Branch naming convention**:
  - `feat/<feature-name>` for new features
  - `experiment/<experiment-name>` for prototypes and experiments
  - `fix/<bug-name>` for bug fixes and patches
- **Merge gate**: Never merge a feature branch into `main` without explicit user permission in the active conversation.
- **Explicit merge commits**: When authorized to merge, always use `git merge --no-ff <branch-name>` to preserve explicit merge topology in `git log --graph`.

## Tools / Scripts to Use
- Branch & commit management: `git status`, `git checkout -b <branch>`, `git add`, `git commit`.
- Merge tool: `git merge --no-ff <branch>` (only after user confirmation).
- Validation scripts: `python execution/run_typecheck.py` and `python execution/verify_project_health.py`.

## Outputs
- Clean, isolated git feature branches.
- Complete audit trail of commits and pull requests.
- Main branch remains continuously deployable and pristine.

## Edge Cases & Error Handling
- **Pre-existing Uncommitted Changes**: Carry changes onto the newly created feature branch or stash appropriately before proceeding.
- **Merge Conflicts**: When resolving conflicts during `git merge --no-ff`, inspect both versions, resolve conflicts explicitly, run `python execution/run_typecheck.py`, and obtain confirmation before finalizing the merge commit.
- **Unauthorized Browser Automation**: Do not run browser subagent verification or browser automation tools unless the user explicitly asks for it.
