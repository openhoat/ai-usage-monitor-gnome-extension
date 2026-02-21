# MCP IntelliJ Integration

## Objective

Use the MCP IntelliJ integration to leverage JetBrains IDE capabilities for code analysis, refactoring, and navigation.

## When to Use MCP IntelliJ

Use MCP IntelliJ when you need to:
- Navigate to specific code locations (symbols, files, line numbers)
- Perform code analysis on specific classes or files
- Find references and usages of symbols
- Search for code patterns across the project
- Analyze code structure and dependencies
- Refactor code with IDE assistance
- **Get IDE diagnostics, errors, warnings, and code inspections**

## Available MCP IntelliJ Tools
- **Identify and fix code errors detected by the IDE** (TypeScript errors, warnings, inspections)

## Available MCP IntelliJ Tools

### `navigate_to_symbol`

Navigate to a specific symbol in the codebase.

**Use when**: You need to find a class, function, variable, or other symbol by name.

**Example**: Navigate to the `ChatPanel` component to understand its structure.

### `navigate_to_file`

Navigate to a specific file path and optional line number.

**Use when**: You need to open a specific file at a specific location.

**Example**: Open `src/services/commandExecutionService.ts` at line 45 to review the `executeCommand` function.

### `find_references`

Find all references to a symbol in the codebase.

**Use when**: You need to understand where a function, class, or variable is used.

**Example**: Find all usages of the `useStore` hook to understand state management patterns.

### `search_in_files`

Search for text patterns across files in the project.

**Use when**: You need to find specific patterns, TODOs, or code usages.

**Example**: Search for "TODO" comments in TypeScript files to identify pending work.

### `analyze_class`

Analyze the structure of a class or component.

**Use when**: You need to understand the methods, properties, and dependencies of a class.

**Example**: Analyze the `Header` component to understand its props and exported functions.

### `find_code_pattern`

Find code matching a specific pattern (e.g., function calls, assignments).

**Use when**: You need to find specific coding patterns or anti-patterns.

**Example**: Find all `useState` hooks in the components directory.

### `get_diagnostics`

Get all diagnostics (errors, warnings, info, hints) detected by the IDE for a specific file or the entire project.

**Use when**: You need to identify and fix code issues detected by IntelliJ.

**Example**: Get diagnostics for `src/components/ChatPanel.tsx` to see TypeScript errors and warnings.

### `get_diagnostics_for_symbol`

Get diagnostics specifically for a symbol or at a specific file location.

**Use when**: You need to understand issues related to a specific function, class, or code line.

**Example**: Get diagnostics for the `executeCommand` function to see specific issues.

### `get_quick_fixes`

Get available quick fixes for a diagnostic issue.

**Use when**: The IDE provides automatic fixes for detected issues.

**Example**: Get quick fixes for a TypeScript error to apply suggested corrections.

### `get_diagnostics`

Get diagnostics (errors, warnings, info) from the IDE for a file or the entire project.

**Use when**: You need to identify TypeScript errors, linting issues, code inspections detected by IntelliJ/WebStorm.

**Example**: Get all diagnostics for `src/components/ChatPanel.tsx` to fix type errors.

### `get_file_errors`

Get detailed error information for a specific file including line numbers and error messages.

**Use when**: You need to see specific errors in a file to fix them systematically.

**Example**: Get errors for `src/services/commandExecutionService.ts` to resolve TypeScript issues.

## Best Practices

### 1. TypeScript/React Focus

When analyzing code, prioritize:
- React components (`src/components/`)
- Type definitions (`@shared/types`)
- Zustand store (`src/store/`)
- Service layer (`src/services/`)

### 2. Code Navigation Workflow

Before making changes to code:
1. Use `navigate_to_symbol` or `navigate_to_file` to view the code
2. Use `find_references` to understand usage patterns
3. Use `analyze_class` to understand structure
4. Make changes with full context

### 3. Code Analysis Before Refactoring

Before refactoring:
1. Use `find_references` on the symbol to be refactored
2. Use `search_in_files` for related patterns
3. Analyze all impacted files
4. Plan changes before executing

### 4. Pattern Discovery

Use `find_code_pattern` to discover:
- All React hooks usage
- All state management patterns
- All event handlers
- All async operations

## Example Workflows

### Workflow 1: Understanding Component Usage

**Goal**: Understand how `ChatPanel` is used across the application.

**Steps**:
1. Use `navigate_to_symbol` to find `ChatPanel`
2. Use `find_references` to find all usages
3. Use `analyze_class` to understand its interface
4. Review all files that import/use ChatPanel

### Workflow 2: Finding State Management Patterns

**Goal**: Find all state management in the application.

**Steps**:
1. Use `find_code_pattern` to search for `useState` hooks
2. Use `search_in_files` to find `useStore` usages
3. Analyze the store implementation
4. Document the state management approach

### Workflow 3: Pre-Refactoring Analysis

**Goal**: Refactor `commandExecutionService.ts` to add new security features.

**Steps**:
1. Use `navigate_to_file` to open the service
2. Use `find_references` to find all callers of `executeCommand`
3. Analyze the current security functions
4. Plan the refactoring based on usage patterns

### Workflow 4: Fixing IDE-Detected Errors

**Goal**: Fix all TypeScript errors and warnings in the project.

**Steps**:
1. Use `get_diagnostics` for the entire project to get all issues
2. Filter by severity: fix errors first, then warnings
3. Use `navigate_to_file` for each diagnostic location
4. Apply fixes or use `get_quick_fixes` for automated corrections
5. Re-run `get_diagnostics` to verify all issues resolved

**Example**:
```
1. Get diagnostics: 5 errors, 12 warnings found
2. Fix error in ChatPanel.tsx line 23 (missing import)
3. Fix error in commandExecutionService.ts line 45 (type mismatch)
4. Apply quick fix for 3 warnings (unused variables)
5. Re-check: 0 errors, 9 warnings remaining
```

### Workflow 4: Fixing IDE-Detected Errors

**Goal**: Fix TypeScript and code quality issues detected by IntelliJ.

**Steps**:
1. Use `get_diagnostics` for a file or the entire project
2. Analyze reported errors, warnings, and inspections
3. Use `navigate_to_file` with line numbers to jump to issue locations
4. Use `get_quick_fixes` to see available automatic fixes
5. Apply fixes using Edit tool or suggested quick fixes
6. Re-run `get_diagnostics` to verify all issues are resolved

**Example**: Fix TypeScript errors in `src/components/ChatPanel.tsx`:
1. Get diagnostics for the file
2. See error: "Type 'string' is not assignable to type 'AICommand | Message'"
3. Navigate to line 42 where error occurs
4. Get quick fixes - suggests adding type guard or changing type
5. Apply the fix using Edit tool

## Integration with Other Rules

When using MCP IntelliJ:
- Follow **Language Rule**: All analysis results in English
- Follow **Testing Rule**: When analyzing test files, check for `test()` usage
- Follow **Quality Check Rule**: After code changes, run `npm run validate`

## Important Rules

- Always read code context using MCP tools before making changes
- Use `find_references` before refactoring to understand impact
- Analyze multiple files when making cross-module changes
- Prioritize understanding code structure over making quick changes
- Use MCP tools in combination with Read/Edit tools for complete workflow

## Notes

- MCP IntelliJ provides deep IDE integration unavailable through file reads
- Use it for navigation and analysis, not for direct code modification
- Combine MCP IntelliJ insights with Claude Code's editing tools
- The tool returns structured data about code structure and references