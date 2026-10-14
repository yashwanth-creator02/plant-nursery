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

## Git Safety
- **Always branch first**: Never commit directly to `main` or `master`.
- **Branch naming convention**:
  - `feat/<feature-name>` for new features
  - `experiment/<experiment-name>` for prototypes and experiments
  - `fix/<bug-name>` for bug fixes and patches
- **Merge gate**: Never merge a feature branch into `main` without explicit user permission in the active conversation.
- **Explicit merge commits**: When authorized to merge, always use `git merge --no-ff <branch-name>` to preserve explicit merge topology in `git log --graph`.

## Tools / scripts to use
- `git status`, `git checkout -b <branch>`, `git add`, `git commit`.
- `git merge --no-ff <branch>` (only after user confirmation).

## Testing & Verification Constraints
- **Zero unauthorized browser automation**: Do not run browser subagent verification or browser automation tools unless the user explicitly requests it.
- Use command-line checks (`npx tsc --noEmit`, `npm run build`, `npm run lint`) for automated code validation.

## Outputs
- Clean, isolated git feature branches.
- Complete audit trail of commits and pull requests.
- Main branch remains continuously deployable and pristine.

## Edge cases
- If uncommitted changes already exist when starting a new task, carry them onto the newly branched feature branch or stash appropriately before proceeding.
- If merge conflicts occur on `git merge --no-ff`, resolve them explicitly and document each resolution before completing the commit.
