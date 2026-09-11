# Repository Rules

## Git Workflow
- **Always create a new git feature branch before implementing any new feature, refactor, or enhancement.**
- Standard branch naming convention:
  - `feat/<feature-name>` for new features
  - `experiment/<experiment-name>` for prototypes
  - `fix/<bug-name>` for bug fixes
- Develop and verify changes on the feature branch before merging back to `main`.
- **Always merge using `git merge --no-ff <branch-name>`** to ensure an explicit merge commit is created, preserving the branch topology in `git log --graph`.
