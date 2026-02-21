# Cline Workflow for Kanban Cleanup

## Objective

This workflow allows manual cleanup of obsolete entries in the `/KANBAN.md` file. It identifies entries eligible for cleanup and requests confirmation before deletion.

## Format rules

See `.clinerules/task_format.md` for detailed format rules.

Summary:
- `- [ ]` → task to do
- `- [x]` → checked task (completed)
- Task format: `- [ ] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Description`

## Execution instructions

### 1. Read KANBAN.md

Use the `read_file` tool to read the content of the `/KANBAN.md` file at the project root.

### 2. Analyze entries eligible for cleanup

Identify entries in the "## 🚧 In Progress" section that can be cleaned up:

#### In Progress inactive for > 30 days

- Idea sections with incomplete tasks for > 30 days
- Isolated incomplete tasks for > 30 days
- Abandoned sections/tasks (identifiable by comment or context)

### 3. Present eligible entries to user

Display the list of entries eligible for cleanup with a number for each. Use the `ask_followup_question` tool to ask the user:
- Which entries they want to delete
- If they want to delete all identified entries
- If they prefer to move them to a "## 📦 Archived" section (optional)

### 4. Delete selected entries

For each selected entry:

#### 4a. Delete isolated task

Use `replace_in_file` to delete the task line:
- The SEARCH block must match exactly the line containing the task

#### 4b. Delete idea section

Use `replace_in_file` to delete the complete block:
- The SEARCH block must include the section header (`### [DATE] 💡 [IDEA] ...`)
- And all associated tasks

### 5. Optional: Move to Archive

If the user prefers to archive rather than delete:

#### 5a. Create Archive section

If the "## 📦 Archived" section doesn't exist, create it at the bottom of KANBAN.md:

```markdown
## 📦 Archived

(No archived entries for the moment)
```

#### 5b. Move entries

For each entry to archive:
1. Extract the block (idea header + tasks or isolated task line)
2. Delete from original section
3. Add to "## 📦 Archived" section

### 6. Update KANBAN.md

Use `replace_in_file` to apply deletion or archiving modifications.

### 7. Execution report

Inform the user:
- Of deleted or archived entries
- Of modified sections in KANBAN.md
- In case of error, explain the reason without modifying KANBAN.md

## Important rules

- This workflow is **manual**: it must be explicitly requested by the user
- **Always request confirmation** before deleting entries
- Never delete entries without explicit user validation
- For inactive "In Progress" entries, request confirmation before deletion

## Example flow

```
1. Read KANBAN.md

2. Analyze eligible entries:
   - In Progress: 1 idea section inactive for 45 days

3. Present to user:
   # Entries eligible for cleanup

   In Progress inactive for > 30 days:
   1. [15/01/2026] 💡 [IDEA] Refactor code base (3 incomplete tasks)

   What do you want to do?
   - Delete entry 1 (Abandoned In Progress)
   - Archive entry 1
   - Cancel

4. User chooses to archive entry 1

5. Move section #1 to Archive

6. Report: 1 section archived
```

## Example KANBAN.md before/after

**Before - In Progress (inactive):**
```markdown
## 🚧 In Progress
### [15/01/2026 08:00:00] 💡 [IDEA] Refactor code base
- [x] **[15/01/2026 09:00:00] ♻️ [REFACTOR]** Restructure folders
- [ ] **[15/01/2026 09:30:00] ♻️ [REFACTOR]** Rename components
- [ ] **[15/01/2026 10:00:00] ✅ [TEST]** Add unit tests
```

**After archiving - In Progress:**
```markdown
## 🚧 In Progress

(No work in progress for the moment)
```

**After archiving - Archived:**
```markdown
## 📦 Archived
### [15/01/2026 08:00:00] 💡 [IDEA] Refactor code base (abandoned)
- [x] **[15/01/2026 09:00:00] ♻️ [REFACTOR]** Restructure folders
- [ ] **[15/01/2026 09:30:00] ♻️ [REFACTOR]** Rename components
- [ ] **[15/01/2026 10:00:00] ✅ [TEST]** Add unit tests
```

## Suggested cleanup criteria

### In Progress section
- Sections/tasks inactive for more than 30 days
- Abandoned sections/tasks (identifiable by context)
- Outdated or replaced ideas

## Note

This workflow is optional and must be executed manually by the user when they deem it necessary. There is no scheduled automatic cleanup.