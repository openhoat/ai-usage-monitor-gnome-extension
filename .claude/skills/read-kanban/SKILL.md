---
name: read-kanban
description: Read and parse KANBAN.md to extract tasks, ideas, and their status.
disable-model-invocation: false
---

# Skill: Read KANBAN

## Description

Read and parse the KANBAN.md file to extract tasks, ideas, and their status.

## Purpose

This skill reads the KANBAN.md file and provides a structured summary of its contents.

## Usage

Invoke this skill when you need to:
- Check current tasks in progress
- Review backlog ideas
- Verify completed tasks
- Prepare for task execution or orchestration

## Execution Steps

1. Read the KANBAN.md file using the `read_file` tool.

2. Parse and extract content from each section:
   - 📝 Backlog: Feature ideas to be converted to tasks
   - 🚧 In Progress: Ideas being worked on with tasks, or isolated tasks
   - ✅ Done: Completed tasks

3. For the In Progress section:
   - Identify idea sections (starting with `### [DATE] 💡 [IDEA]`)
   - Extract tasks under each idea
   - Identify isolated tasks (not under an idea section)

4. Generate a structured summary.

## Output Format

```
KANBAN Summary
==============

Backlog (N ideas):
- [DATE] 💡 [IDEA] Description
- [DATE] 💡 [IDEA] Description

In Progress (N ideas, M isolated tasks):

Ideas:
### [DATE] 💡 [IDEA] Description
  - [x] Completed task
  - [ ] Pending task
  - [ ] Pending task

Isolated Tasks:
- [ ] [DATE] Emoji [TAG] Description
- [ ] [DATE] Emoji [TAG] Description

Done (N tasks):
- [x] [DATE] Emoji [TAG] Description
```

## Format Rules Reference

- `- [ ]`: Task to do
- `- [x]`: Completed task
- Idea format: `- [ ] **[DD/MM/YYYY HH:mm:ss] 💡 [IDEA]** Description`
- Task format: `- [ ] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Description`

## Tags
- `✨ [FEAT]`: New feature
- `🐛 [FIX]`: Bug fix
- `♻️ [REFACTOR]`: Refactoring
- `⚡ [PERF]`: Performance
- `📝 [DOCS]`: Documentation
- `🎨 [STYLE]`: Style/Cosmetic
- `✅ [TEST]`: Tests
- `🔧 [CHORE]`: Configuration/Maintenance

## Notes

- KANBAN.md is located at the project root
- Use this skill to understand current project state
- Task format rules are defined in `.clinerules/task_format.md`