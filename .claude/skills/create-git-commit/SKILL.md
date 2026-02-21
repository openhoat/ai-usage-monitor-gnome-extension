---
name: create-git-commit
description: Create git commit following Conventional Commits format. Use after completing tasks.
disable-model-invocation: false
---

# Skill: Create Git Commit

## Description

Stage files and create a git commit following Conventional Commits format.

## Purpose

This skill stages modified files and creates a properly formatted git commit message.

## Usage

Invoke this skill when you need to:
- Commit completed tasks
- Commit bug fixes
- Commit code changes following Conventional Commits

## Execution Steps

1. Stage the modified files:
   ```bash
   git add <file1> <file2> ...
   ```
   Include all files modified for this task/idea.

2. Create the commit with a formatted message:
   ```bash
   git commit -m "<commit message>"
   ```

3. Verify the commit was successful.

## Commit Message Format

Follow Conventional Commits format:

```
<TYPE>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Styling/formatting
- `refactor`: Refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance/Configuration
- `revert`: Revert commit

### Writing Rules
- Use imperative mood (e.g., "Add" not "Added")
- Start with capital letter
- Don't end with period
- Limit subject line to 72 characters

### Examples

**Simple commit:**
```
feat: add user authentication system
```

**Commit with body:**
```
feat: add user authentication system

Implement JWT-based authentication with:
- Login/logout functionality
- Token refresh mechanism
- Protected route guards
```

**Idea commit with multiple tasks:**
```
feat: add a dark/light theme system

- Install necessary dependencies (npm install theme-provider)
- Create ThemeSwitcher component in src/components/
- Create CSS styles for dark theme
- Add toggle in application header
```

## Error Handling

If commit fails:
1. Check if git repository is initialized
2. Verify files are staged
3. Check for commit message format errors
4. Review git configuration (user.name, user.email)

## Notes

- Commit messages must be in English
- Follow project's commitlint configuration
- Always include CHANGELOG.md in commits
- Use this skill after successful task completion