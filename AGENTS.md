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
