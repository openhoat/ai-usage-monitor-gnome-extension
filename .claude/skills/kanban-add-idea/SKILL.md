---
name: kanban-add-idea
description: Add a new idea to the kanban backlog with priority and category. Use when user wants to add feature ideas.
disable-model-invocation: false
argument-hint: [description]
---

# Skill: Add Idea to Kanban Backlog

Add a new feature idea to the "Backlog" section of the KANBAN.md file.

## Execution Steps

### 1. Read KANBAN.md

Read the KANBAN.md file at the project root to understand the current structure.

### 2. Ask for idea description

Ask the user:
```
What idea would you like to add to the backlog?
```

### 3. Ask for priority

Ask the user:
```
What is the priority of this idea?
- 🔴 P1: High Priority (critical, security, blocking issues)
- 🟡 P2: Medium Priority (important improvements)
- 🟢 P3: Low Priority (nice to have, enhancements)
```

### 4. Ask for category

Ask the user:
```
What category does this idea belong to?
- 🔒 [SECURITY]: Security improvements
- ✅ [TEST]: Testing improvements
- 🚀 [PERFORMANCE]: Performance optimizations
- 🏗️ [ARCHITECTURE]: Code architecture improvements
- 🎨 [UX]: User experience improvements
- 🔧 [DEVOPS]: DevOps improvements
- 🌍 [I18N]: Internationalization improvements
- 📦 [DEPENDENCIES]: Dependency updates
- ⚙️ [CONFIG]: Configuration improvements
```

### 5. Generate timestamp

Generate current timestamp in format: `DD/MM/YYYY HH:mm:ss`

### 6. Create the idea entry

Format:
```markdown
- [ ] **[DD/MM/YYYY HH:mm:ss] Priority CategoryEmoji [CATEGORY]** Description
```

Example:
```markdown
- [ ] **[16/02/2026 14:30:15] 🟡 P2 🎨 [UX]** Add support for keyboard shortcuts
```

### 7. Add to appropriate priority section

Find the correct priority subsection in Backlog:
- `### 🔴 P1 - High Priority`
- `### 🟡 P2 - Medium Priority`
- `### 🟢 P3 - Low Priority`

Add the new idea at the TOP of the list in the appropriate section.

### 8. Confirm addition

Inform the user of the successful addition with timestamp, priority, category, and description.

## Format Rules

- Use exact description provided by user (no modification)
- Generate timestamp automatically
- Priority: `🔴 P1`, `🟡 P2`, `🟢 P3`
- Category icons: `🔒`, `✅`, `🚀`, `🏗️`, `🎨`, `🔧`, `🌍`, `📦`, `⚙️`