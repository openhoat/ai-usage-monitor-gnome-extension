# Claude Code Rules

This directory contains project rules for Claude Code.

## Rules

| File | Description |
|------|-------------|
| `commit_messages.md` | Git commit messages in Conventional Commits (English) |
| `language.md` | All content must be in English |
| `language_preference.md` | Respond in French to user unless specified otherwise |
| `log_changes.md` | Log modifications in CHANGELOG.md |
| `markdown_formatting.md` | Standard markdown formatting (no consecutive blank lines) |
| `task_format.md` | Task format for KANBAN.md and CHANGELOG.md |
| `subagents.md` | When and how to use Claude Code subagents |
| `testing.md` | Testing conventions and practices |
| `quality_check.md` | Code quality check rules |
| `mcp_intellij.md` | MCP IntelliJ integration rules |

## Workflow

When working on this project with Claude Code:

1. **Read and understand** the rules before starting work
2. **Use English** for all code, comments, documentation, and commit messages
3. **Follow Kanban workflow** when working on tasks
4. **Log changes** in CHANGELOG.md after successful modifications
5. **Follow Conventional Commits** for all git commits

## Quick Reference

### Commit Message Format
```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### CHANGELOG Entry Format
```
**[HH:MM:SS] ✨ [FEAT]** Description
```

Tags: `[FEAT]`, `[FIX]`, `[REFACTOR]`, `[PERF]`, `[DOCS]`, `[STYLE]`, `[TEST]`, `[CHORE]`