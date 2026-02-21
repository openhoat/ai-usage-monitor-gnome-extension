# Task Format Rules

Common format rules for KANBAN.md and CHANGELOG.md.

## KANBAN Task Format

```
- [ ] **#identifier [DD/MM/YYYY HH:mm:ss] Priority CategoryEmoji [CATEGORY]** Description
```

### Priority Levels

- 🔴 **P1** = High Priority (critical, security, blocking)
- 🟡 **P2** = Medium Priority (important improvements)
- 🟢 **P3** = Low Priority (nice to have)

### Category Icons

- 🔒 **[SECURITY]**: Security improvements
- ✅ **[TEST]**: Testing improvements
- 🚀 **[PERFORMANCE]**: Performance optimizations
- 🏗️ **[ARCHITECTURE]**: Code architecture
- 🎨 **[UX]**: User experience
- 🔧 **[DEVOPS]**: DevOps improvements
- 🌍 **[I18N]**: Internationalization
- 📦 **[DEPENDENCIES]**: Dependency updates
- ⚙️ **[CONFIG]**: Configuration

## CHANGELOG Entry Format

```
**[HH:MM:SS] Emoji [TAG]** Description
```

### Task Tags

- `✨ [FEAT]`: New feature
- `🐛 [FIX]`: Bug fix
- `♻️ [REFACTOR]`: Refactoring
- `⚡ [PERF]`: Performance
- `📝 [DOCS]`: Documentation
- `🎨 [STYLE]`: Style
- `✅ [TEST]`: Tests
- `🔧 [CHORE]`: Configuration