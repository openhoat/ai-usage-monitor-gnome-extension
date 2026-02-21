# Workflow Cline: Release

## Objective

Automate the release process: version bump, changelog regeneration, git commit, and tag creation.

## Execution Steps

### 1. Read current version

Read the current version from `package.json`:
```bash
node -e "console.log(require('./package.json').version)"
```

Display the current version to the user.

### 2. Ask bump type

Ask the user which version bump to apply:

```
Current version: X.Y.Z

Which version bump?
- patch (X.Y.Z+1) - Bug fixes, minor changes
- minor (X.Y+1.0) - New features, backward compatible
- major (X+1.0.0) - Breaking changes
```

### 3. Compute new version

Calculate the new version based on the bump type:
- **patch**: Increment Z (e.g., 1.0.0 -> 1.0.1)
- **minor**: Increment Y, reset Z (e.g., 1.0.0 -> 1.1.0)
- **major**: Increment X, reset Y and Z (e.g., 1.0.0 -> 2.0.0)

Display the new version and ask for confirmation.

### 4. Bump version across all files

Use the bump-version script to update version in all relevant files:
```bash
npm run bump-version -- <patch|minor|major>
```

This script updates:
- `package.json` (via npm version)
- `package-lock.json` (via npm version)
- `README.md` (download links)

### 5. Verify bumped version

Read back the version from `package.json` to confirm the bump was applied correctly:
```bash
node -e "console.log(require('./package.json').version)"
```

Store this value as `NEW_VERSION` and use it for all subsequent steps (commit message, tag name).
If the version does not match the expected bump, abort and investigate.

### 6. Regenerate CHANGELOG

Run the changelog generation script:
```bash
npm run changelog
```

### 7. Run validation

Run the project validation to ensure everything is clean:
```bash
npm run validate
```

If validation fails, fix the issues before proceeding.

### 8. Create git commit

Stage all modified files and create the release commit using `NEW_VERSION` from step 5:
```bash
git add package.json package-lock.json README.md CHANGELOG.md
git commit -m "chore(release): bump version to v${NEW_VERSION}"
```

### 9. Create git tag

Create an annotated git tag using `NEW_VERSION` from step 5:
```bash
git tag -a v${NEW_VERSION} -m "Release v${NEW_VERSION}"
```

### 10. Ask about pushing

Ask the user if they want to push the commit and tag to trigger the CI release pipeline:

```
Release v${NEW_VERSION} created locally.

Push to remote to trigger CI release pipeline?
- Yes, push commit and tag
- No, keep local only
```

If yes:
```bash
git push && git push --tags
```

### 11. Summary

Display a release summary:
```
Release Summary:
- Version: ${OLD_VERSION} -> ${NEW_VERSION}
- Commit: <hash>
- Tag: v${NEW_VERSION}
- Pushed: yes/no

Next steps:
- If pushed: CI pipeline will build and publish executables
- If not pushed: run `git push && git push --tags` when ready
```

## Error Handling

### npm version fails
- Check if package.json is valid JSON
- Verify the current version format is valid semver

### Validation fails
- Fix issues reported by `npm run validate`
- Re-run the workflow from step 6

### Git commit fails
- Check for uncommitted changes that need to be staged
- Verify git configuration (user.name, user.email)

### Git tag fails
- Check if the tag already exists: `git tag -l vX.Y.Z`
- Delete existing tag if needed: `git tag -d vX.Y.Z`

### Push fails
- Check remote configuration: `git remote -v`
- Verify authentication and permissions

## Important Rules

- Always run validation before creating the release commit
- The tag format must be `vX.Y.Z` (with `v` prefix) to trigger the CI pipeline
- Commit message must follow Conventional Commits: `chore(release): bump version to vX.Y.Z`
- Never force push tags
- Always ask for confirmation before pushing

## Integration

This workflow works with:
- `.github/workflows/release.yml` - CI pipeline triggered by `v*` tags
- `scripts/bump-version.js` - Centralized version bumping across all files
- `scripts/generate-changelog.js` - Changelog generation from git history
- `package.json` - Version source of truth
