# Commit Changes Workflow

Workflow for creating git commits from CHANGELOG.md entries.

## Steps

### 1. Check git status

Run `git status` to identify modified files.

### 2. Read CHANGELOG.md

Read the CHANGELOG.md file to get recent entries.

### 3. Map files to changelog entries

Associate modified files with the corresponding CHANGELOG entries.

### 4. Generate commit message

Create a commit message following Conventional Commits format:

```
<type>: <description>

- Detail 1
- Detail 2
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### 5. Stage and commit

```bash
git add <files>
git commit -m "<message>"
```

### 6. Confirm

Display the commit hash and message for confirmation.