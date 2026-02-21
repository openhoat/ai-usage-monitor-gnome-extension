---
name: generate-changelog
description: Regenerate CHANGELOG.md from Git commit history. Use after committing changes.
disable-model-invocation: false
---

# Skill: Generate Changelog

## Description

Regenerate the CHANGELOG.md file from Git commit history.

## Purpose

This skill runs the changelog generation script to update CHANGELOG.md based on recent commits.

## Usage

Invoke this skill when you need to:
- Update CHANGELOG.md after committing changes
- Generate documentation of recent changes
- Keep project history up to date

## Execution Steps

1. Run the changelog generation script:
   ```bash
   npm run changelog
   ```

2. Wait for the script to complete.

3. Verify the CHANGELOG.md was updated successfully.

## How It Works

The script `scripts/generate-changelog.js`:
- Reads Git commit history
- Parses commit messages following Conventional Commits format
- Generates structured entries in CHANGELOG.md
- Organizes entries by year, month/day, and time

## CHANGELOG.md Format

```markdown
# History

## Modification History

### YYYY

#### MM/DD

**[HH:MM:SS] Emoji [TAG]** Description
```

### Tags and Emojis
- `✨ [FEAT]` - New feature
- `🐛 [FIX]` - Bug fix
- `♻️ [REFACTOR]` - Refactoring
- `⚡ [PERF]` - Performance
- `📝 [DOCS]` - Documentation
- `🎨 [STYLE]` - Style/Cosmetic
- `✅ [TEST]` - Tests
- `🔧 [CHORE]` - Configuration/Maintenance

## Output Analysis

After running, report:
- Number of commits processed
- Date range covered
- Any issues or warnings

## Error Handling

If generation fails:
1. Check if Git repository has commits
2. Verify script exists in `scripts/generate-changelog.js`
3. Check commit message format compliance
4. Review error messages from the script

## Important Notes

- CHANGELOG.md should NOT be manually edited
- It's automatically generated from Git history
- Run this after each batch of commits
- Include CHANGELOG.md in git commits when it's updated

## Integration

This skill should be called:
- After completing a set of tasks in KANBAN
- After creating git commits
- Before marking work as complete