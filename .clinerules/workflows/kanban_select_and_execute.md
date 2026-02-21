# Kanban Select and Execute Workflow

Interactive workflow for selecting and executing backlog ideas.

## Steps

### 1. Read KANBAN.md

Read the KANBAN.md file at the project root.

### 2. List backlog ideas

Display all unchecked ideas from "## 📝 Backlog" with numbers:

```
📋 **Backlog Ideas:**

**#1** [P3] 🎨 [UX] Improve the GNOME extension icon
**#2** [P2] 🏗️ [ARCHITECTURE] Add error retry logic

Type the number(s) of the idea(s) you want me to execute:
```

### 3. Get user selection

Accept:
- Single number: `1`
- Multiple numbers: `1,3,5`
- Range: `1-3`
- All: `all`

### 4. For each selected idea

#### 4a. Ask for task breakdown

Show the selected idea and ask how to break it down into tasks.

#### 4b. Create In Progress section

Create in "## 🚧 In Progress":
```markdown
### [DD/MM/YYYY HH:mm:ss] Priority CategoryEmoji [CATEGORY] Idea description
- [ ] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Task 1
- [ ] **[DD/MM/YYYY HH:mm:ss] Emoji [TAG]** Task 2
```

#### 4c. Execute tasks

For each task:
1. Display current task
2. Ask for confirmation
3. Execute the task
4. Mark as completed

#### 4d. Create commit and update

1. Generate commit message
2. Stage and commit files
3. Update CHANGELOG.md
4. Move tasks to Done
5. Delete from In Progress

### 5. Summary

Display execution summary with completed tasks and commits.