# Subagents Rule

## Objective

This rule defines when and how to use Claude Code subagents to efficiently handle complex, independent tasks through parallel execution.

## When to use subagents

Use subagents when you need to:

- **Execute multiple independent tasks simultaneously**
- **Perform comprehensive testing** across multiple components or scenarios
- **Generate extensive documentation** for different parts of the codebase
- **Refactor isolated modules** that don't require coordination with other changes
- **Run deep code analysis** on specific areas without blocking the main workflow

## Available subagent types

Claude Code provides specialized subagents for different tasks:

| Subagent | Purpose | Tools Available |
|----------|---------|-----------------|
| `Bash` | Command execution specialist | Bash |
| `Explore` | Fast codebase exploration | All tools except Task, Edit, Write, NotebookEdit |
| `Plan` | Software architecture and implementation planning | All tools except Task, Edit, Write, NotebookEdit |
| `general-purpose` | Researching complex questions, searching code, multi-step tasks | All tools |
| `claude-code-guide` | Questions about Claude Code CLI, Agent SDK, API | Glob, Grep, Read, WebFetch, WebSearch |

## Command syntax

To launch a subagent, use the `Task` tool:

```javascript
Task({
  description: "Brief task description (3-5 words)",
  prompt: "Detailed task description with all necessary context",
  subagent_type: "subagent_name",
})
```

**Important**: The prompt must be:
- Clear and specific
- Self-contained (the subagent should have all necessary context)
- Independently executable
- Focused on a single objective

## Best practices

### 1. Formulate self-contained tasks

Provide all necessary context in the prompt:

```javascript
// Good
Task({
  description: "Analyze extension.js for errors",
  prompt: "Analyze the GNOME extension in extension/extension.js and identify potential issues with GObject registration or signal handling.",
  subagent_type: "Explore"
})

// Bad
Task({
  description: "Analyze extension",
  prompt: "Analyze the extension",
  subagent_type: "Explore"
})
```

### 2. Use for parallelization

Launch multiple subagents when tasks are independent:

```javascript
// Launch in parallel (multiple Task tool calls in a single message)
Task({ description: "Test fetch-usage", prompt: "...", subagent_type: "general-purpose" })
Task({ description: "Test extension loading", prompt: "...", subagent_type: "general-purpose" })
```

### 3. Choose the right subagent type

- **Bash**: For simple command execution, git operations, terminal tasks
- **Explore**: For fast codebase searches, finding files, understanding patterns
- **Plan**: For implementation planning, architectural decisions
- **general-purpose**: For complex multi-step tasks

## When NOT to use subagents

Avoid using subagents for:

- **Tasks requiring coordination** with the main agent or other subagents
- **Modifications to files currently being edited** in the main workflow
- **Critical operations** that need immediate supervision and verification
- **Simple tasks** that can be completed quickly in the main workflow

## Integration with other rules

When using subagents, ensure they also follow:

- **Language Rule**: All subagent output must be in English
- **Commit Messages Rule**: If subagent makes git commits, messages must follow Conventional Commits in English
- **Log Changes Rule**: Subagent should log changes in CHANGELOG.md

## Important rules

- **Always provide sufficient context** in the prompt
- **Verify subagent output** before considering the task complete
- **Use subagents for parallelization** when tasks are truly independent
- **Choose the appropriate subagent type** for the task at hand
- **Prefer using direct tools** (Read, Glob, Grep) for simple directed searches instead of subagents