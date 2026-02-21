# Kanban Add Idea Workflow

Interactive workflow for adding new ideas to the backlog.

## Steps

### 1. Ask for idea description

```
What idea would you like to add to the backlog?
```

### 2. Ask for priority

```
What is the priority of this idea?
- 🔴 P1: High Priority (critical, security, blocking issues)
- 🟡 P2: Medium Priority (important improvements)
- 🟢 P3: Low Priority (nice to have, enhancements)
```

### 3. Ask for category

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

### 4. Generate timestamp

Generate current timestamp in format: `DD/MM/YYYY HH:mm:ss`

### 5. Create the idea entry

Format:
```markdown
- [ ] **#identifier [DD/MM/YYYY HH:mm:ss] Priority CategoryEmoji [CATEGORY]** Description
```

### 6. Add to Backlog

Add the new idea to the 📝 Backlog section in KANBAN.md.