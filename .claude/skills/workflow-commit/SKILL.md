---
name: workflow-commit
description: Complete commit workflow - validate, commit, generate changelog, and update kanban in one command. Use instead of create-git-commit for full automation.
disable-model-invocation: false
---

# Skill: Workflow Commit

## Description

Execute the complete commit workflow in one operation:
1. Validate code quality (Biome QA, build, tests)
2. Create git commit with Conventional Commits format
3. Generate changelog from git history
4. Update kanban board

## Purpose

This skill automates the full commit workflow, ensuring all quality checks pass before committing and automatically updating the project documentation.

## Usage

Invoke this skill when you have completed code changes and want to commit with full workflow automation.

## Execution Steps

### 1. Validate code

Run quality validation first:
```bash
npm run validate
```

If validation fails:
- Run `npm run qa:fix` for linting issues
- Fix build errors manually
- Fix test failures
- Re-run validation

Only proceed if validation passes.

### 2. Stage changes

Stage the modified files:
```bash
git add <files>
```

### 3. Create commit

Generate commit message in Conventional Commits format:
```
<type>(<scope>): <subject>

<body>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Create commit:
```bash
git commit -m "<message>"
```

### 4. Generate changelog

Regenerate CHANGELOG.md from git history:
```bash
npm run changelog
# or use /generate-changelog skill
```

Stage and amend changelog:
```bash
git add CHANGELOG.md
git commit --amend --no-edit
```

### 5. Update kanban

Update KANBAN.md to mark completed tasks:
- Check tasks in the "In Progress" section
- Move completed tasks to "Done" or remove them
- Update task status

## Output Format

```
🚀 Workflow Commit
==================

Step 1/5: Validation
  ✅ Biome QA: Passed
  ✅ TypeScript Build: Passed
  ✅ Unit Tests: Passed

Step 2/5: Staging
  Staged files:
  - src/components/NewFeature.tsx
  - src/hooks/useNewFeature.ts

Step 3/5: Commit
  Commit: abc123
  Message: feat: add new feature for user management

Step 4/5: Changelog
  ✅ CHANGELOG.md updated

Step 5/5: Kanban
  ✅ Tasks marked as completed

✅ Workflow Complete
```

## Commit Message Format

The commit message should follow Conventional Commits:

```
feat: add user authentication system

- Install authentication dependencies
- Create AuthProvider component
- Add login/logout functionality
- Implement session management
```

## Important Rules

- Never skip validation step
- Only commit if all checks pass
- Always generate changelog after commit
- Update kanban to reflect progress
- Use English for commit messages
- Follow Conventional Commits format

## Integration with Agents

This skill is used by:
- `kanban-task-executor` - For automated task completion
- `quality-validator` - For post-validation commit workflow

## When to Use

Use this skill when:
- You have completed code changes
- You want full workflow automation
- You want to ensure quality before committing
- You want changelog updated automatically
- You want kanban synchronized

## Alternative Skills

For individual steps:
- `/run-validation` - Just validation
- `/create-git-commit` - Just commit creation
- `/generate-changelog` - Just changelog generation
- `/update-kanban` - Just kanban update