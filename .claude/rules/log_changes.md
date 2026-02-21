# Log Changes

## Objective

This rule ensures that every change made is automatically logged in the `/CHANGELOG.md` file.

## When to execute this rule

After **every successful modification** of the project (creation, editing, or deletion of files).

## Format rules

See `.claude/rules/task_format.md` for detailed format rules.

Summary for CHANGELOG.md:
- Format: `**[HH:MM:SS] Emoji [TAG]** Description`
- Tags and emojis:
  - `✨ [FEAT]` - New feature
  - `🐛 [FIX]` - Bug fix
  - `♻️ [REFACTOR]` - Refactoring
  - `⚡ [PERF]` - Performance
  - `📝 [DOCS]` - Documentation
  - `🎨 [STYLE]` - Style/Cosmetic
  - `✅ [TEST]` - Tests
  - `🔧 [CHORE]` - Configuration/Maintenance
- Sorted in reverse chronological order (most recent at top)
- Organized by year/month/day (full date in sections)

## Logging process

### 1. Identify the modification

Determine the type of modification made:
- **New feature**: Use `✨ [FEAT]`
- **Bug fix**: Use `🐛 [FIX]`
- **Refactoring**: Use `♻️ [REFACTOR]`
- **Performance improvement**: Use `⚡ [PERF]`
- **Documentation**: Use `📝 [DOCS]`
- **Style**: Use `🎨 [STYLE]`
- **Tests**: Use `✅ [TEST]`
- **Configuration/Maintenance**: Use `🔧 [CHORE]`

### 2. Create the CHANGELOG entry

Add a new entry in the appropriate section of `/CHANGELOG.md`:

**Format:**
```markdown
**[HH:MM:SS] ✨ [FEAT]** Concise description of the modification
```

**Writing rules:**
- Start with a verb in infinitive or imperative (ex: "Add", "Fix", "Implement")
- Be concise but informative
- Mention modified files if relevant
- Replace HH:MM:SS with current time

### 3. Placement in the file

Use the `Edit` tool to add the entry:

**If today's date already exists:**
- Find the corresponding date header `### DD/MM`
- Insert the new entry immediately after this header (after the two line breaks)
- Entries must be sorted in reverse chronological order (most recent at top)

**If today's date doesn't exist:**
- Create the date header under the year header `## YYYY`
- Format: `### DD/MM\n\n**[HH:MM:SS] Emoji [TAG]** Description`

**If the year doesn't exist:**
- Create the year header at the top of the file
- Format: `## YYYY\n\n### DD/MM\n\n**[HH:MM:SS] Emoji [TAG]** Description`

## Important rules

- **Always log** successful modifications in CHANGELOG.md
- Use the appropriate tag and emoji
- Always include time in format `HH:MM:SS` (full date is in sections)
- Do not log cancelled or failed modifications
- Do not log file reads or simple analyses

## Exceptions

Do NOT log in CHANGELOG.md:
- Simple file reads for analysis
- Validation/linting command executions
- Unit tests
- Temporary or experimental modifications
- Automatic formatting changes
- Trivial modifications (minor adjustments of less than 3 lines)
- Updates to existing comments or documentation