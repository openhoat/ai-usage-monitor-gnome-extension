# Git Commit Messages

## Objective

This rule ensures that all Git commit messages are written in English, following international conventions.

## Format rules

Commit messages must follow the Conventional Commits format in English:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Styling/formatting (code style changes without functional changes)
- `refactor`: Refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance/Configuration
- `revert`: Revert commit

### Writing rules

1. **Always use English** for commit messages
2. Use imperative verb (e.g., "Add" not "Added" or "Adds")
3. Start with a capital letter
4. Do not end with a period
5. Limit subject line to 72 characters

### Co-authored-by Prohibition

**NEVER add `Co-authored-by:` to commit messages.**

All commits must be attributed exclusively to the human user. Do not attempt to add AI-generated co-authorship metadata under any circumstances.

**Prohibited (never do this):**
```
feat: add user authentication system

Co-authored-by: AI <ai@anthropic.com>
```

**Correct (only the commit message):**
```
feat: add user authentication system
```

This rule applies to all Git commit operations, including:
- `git commit`
- `git commit --amend`

### Examples

**Good examples:**
```
feat: add usage display in GNOME panel
fix: resolve cookie authentication error in fetch-usage
docs: update README with installation instructions
style: format code according to project standards
refactor: simplify usage data parsing logic
perf: optimize API endpoint polling
test: add unit tests for usage parser
chore: upgrade dependencies to latest versions
```

**Bad examples (to avoid):**
```
feat: ajouter l'affichage de l'usage  (French)
fix: corriger l'erreur d'authentification  (French)
feat: Added usage display  (not imperative)
fix: resolve cookie error.  (period at end)
```