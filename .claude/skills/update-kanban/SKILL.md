---
name: update-kanban
description: Update KANBAN.md by modifying task statuses, adding tasks, or removing completed tasks.
disable-model-invocation: false
---

# Skill: Update KANBAN

## Description

Update the KANBAN.md file by modifying task statuses, adding tasks, or removing completed tasks.

## Purpose

This skill modifies the KANBAN.md file to reflect progress on tasks and ideas.

## Usage

Invoke this skill when you need to:
- Mark a task as completed
- Move tasks between sections
- Delete completed sections
- Update task descriptions

## Execution Steps

1. Determine the type of update needed:
   - Check/uncheck a task
   - Move a task between sections
   - Delete a completed section
   - Add a new task

2. Use `replace_in_file` to make the modification:
   - For checking/unchecking: change `- [ ]` to `- [x]` or vice versa
   - For deletion: remove the complete section or task line
   - For addition: insert the task in the appropriate location

3. Verify the update was successful.

## Update Operations

### Mark Task as Completed
Change task checkbox from unchecked to checked:
```markdown
Before: - [ ] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Description
After:  - [x] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Description
```

### Delete Completed Idea Section
Remove the entire idea section including header and all tasks:
```markdown
DELETE:
### [DD/MM/YYYY HH:mm:ss] 💡 [IDEA] Description
- [x] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Task 1
- [x] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Task 2
```

### Delete Completed Isolated Task
Remove the task line:
```markdown
DELETE:
- [x] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Description
```

### Add New Task
Insert task in the appropriate section at the correct position:
```markdown
INSERT:
- [ ] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Description
```

## Important Rules

- Use `replace_in_file` for all modifications
- SEARCH blocks must match the exact content
- One idea = all tasks committed together
- Only delete sections/tasks after successful git commit
- Always include proper formatting with bold and tags

## Format Rules Reference

- Task format: `- [ ] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Description`
- Date format: `DD/MM/YYYY HH:mm:ss`
- Tags: `✨ [FEAT]`, `🐛 [FIX]`, `♻️ [REFACTOR]`, `⚡ [PERF]`, `📝 [DOCS]`, `🎨 [STYLE]`, `✅ [TEST]`, `🔧 [CHORE]`

## Notes

- KANBAN.md is located at the project root
- Task format rules are defined in `.clinerules/task_format.md`
- Use this skill after task execution to update progress
- Always validate updates before committing