# Task Format Rules

## Objective

Defines common format rules for all task files in the project (KANBAN.md, CHANGELOG.md, etc.).

## General format rules

### Checkboxes

- **Task to do**: `- [ ] Task description`
- **Checked task**: `- [x] Task description`
- **Ignored task**: Use a checked checkbox to pause or exclude temporarily

### Comments (optional)

- Comments can be used to document or explain context
- Use HTML Markdown comment format:
  ```markdown
  [//]: # This is an explanatory comment
  ```
- Regex pattern for detection: `^\[\/\/\]: # (.*)$`
- Lines matching this pattern must be ignored during processing

### Task Identifiers (Hash)

Each task in the KANBAN must have a unique identifier based on a content hash:
- **Format**: `#<category>-<subject>` (e.g., `#ux-logo`, `feat-panel`, `fix-cookie`)
- **Category prefix**: Use a short abbreviation of the category (ux, feat, fix, perf, doc, devops, config)
- **Subject**: A short mnemonic describing the task
- **Uniqueness**: Each identifier must be unique within the KANBAN
- **Placement**: Placed at the beginning of the task, before the timestamp

**Examples:**
- `#ux-logo` - UX task about the logo
- `#feat-panel` - Feature task about the panel
- `#fix-cookie` - Bug fix for cookie handling

### Priority Levels

For KANBAN Backlog and In Progress sections, each idea/task must include a priority level:
- **🔴 P1** = High Priority (critical, security, blocking issues)
- **🟡 P2** = Medium Priority (important improvements)
- **🟢 P3** = Low Priority (nice to have, enhancements)

Priority must be placed after the identifier and timestamp, before the category emoji:
`**#hash [DD/MM/YYYY HH:mm:ss] Priority CategoryEmoji [CATEGORY]** Description`

### Category Icons (for Backlog Ideas)

Each idea in the backlog must use a category with its associated icon:
- **🔒 [SECURITY]**: Security improvements
- **✅ [TEST]**: Testing improvements
- **🚀 [PERFORMANCE]**: Performance optimizations
- **🏗️ [ARCHITECTURE]**: Code architecture improvements
- **🎨 [UX]**: User experience improvements
- **🔧 [DEVOPS]**: DevOps improvements
- **🌍 [I18N]**: Internationalization improvements
- **📦 [DEPENDENCIES]**: Dependency updates
- **⚙️ [CONFIG]**: Configuration improvements

### Categorization tags and Emojis (for Tasks)

Each task must use the format with emojis and tags in brackets:
- **✨ [FEAT]**: New feature or evolution
- **🐛 [FIX]**: Bug fix or problem correction
- **♻️ [REFACTOR]**: Refactoring
- **⚡ [PERF]**: Performance
- **📝 [DOCS]**: Documentation
- **🎨 [STYLE]**: Style/Cosmetic
- **✅ [TEST]**: Tests
- **🔧 [CHORE]**: Configuration/Maintenance

### Dates and times

- **Format**: `DD/MM/YYYY HH:mm:ss`
- **Example**: `21/02/2026 11:45:00`
- Used in CHANGELOG.md for modification entries

### Task descriptions

- Start with a verb in infinitive or imperative (ex: "Add", "Fix", "Implement")
- Be concise but informative
- Mention modified files if relevant

## File-specific rules

### KANBAN.md

Contains the Kanban board with three sections: Backlog, In Progress, Done

#### Backlog section (## 📝 Backlog)

- Contains **feature ideas** to convert to tasks (`- [ ]`)
- Format: `- [ ] **#identifier [DD/MM/YYYY HH:mm:ss] Priority CategoryEmoji [CATEGORY]** Idea description`
- Ideas should be sorted by priority (P1 first, then P2, then P3)

**Priority Legend:**
- 🔴 **P1** = High Priority (critical, security, blocking issues)
- 🟡 **P2** = Medium Priority (important improvements)
- 🟢 **P3** = Low Priority (nice to have, enhancements)

#### In Progress section (## 🚧 In Progress)

- Contains **ideas being worked on** with associated tasks OR **isolated tasks**
- Idea sections: start with `### [DD/MM/YYYY HH:mm:ss] 💡 [IDEA] Description`
- Under each idea: tasks with standard emoji/tag format

#### Done section (## ✅ Done)

- Contains **completed tasks** (`- [x]`)
- Format: `- [x] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Description`

### CHANGELOG.md

- Contains only entries of completed modifications
- Structure:
  - Level 1 title: `# History`
  - For each year: level 2 title `## YYYY`
  - For each month/day: level 3 title `### DD/MM`
  - Modification entries with format: `**[HH:MM:SS] Emoji [TAG]** Description`
- Sorted in reverse chronological order (most recent at top)