---
name: run-validation
description: Run comprehensive project validation (Biome QA, TypeScript build, unit tests) with analysis and fix suggestions. Use after code changes.
disable-model-invocation: false
---

# Skill: Run Validation

## Description

Execute the complete project validation workflow including quality checks, build, tests, and provide detailed analysis with fix suggestions.

## Purpose

This skill runs the `npm run validate` command which executes:
- Biome quality checks (`npm run qa`)
- TypeScript build (`npm run build`)
- Unit tests (`npm run test`)

It also provides analysis of failures and suggests fixes.

## Usage

Invoke this skill when you need to validate the project after code changes.

## Execution Steps

### 1. Run validation

```bash
npm run validate
```

This runs in parallel:
- Biome QA checks
- TypeScript build
- Unit tests

### 2. Analyze results

**If all checks pass:**
```
✅ Quality Validation Passed
=============================
- Biome QA: ✓ Passed
- TypeScript Build: ✓ Passed
- Unit Tests: ✓ Passed

Code is ready for commit.
```

**If checks fail:**
```
❌ Quality Validation Failed
=============================
- Biome QA: ✗ Failed (N issues)
- TypeScript Build: ✗ Failed (N errors)
- Unit Tests: ✗ Failed (N tests)
```

### 3. Handle failures by type

#### Biome QA Failures

Run auto-fix:
```bash
npm run qa:fix
```

Then re-run validation:
```bash
npm run validate
```

Common issues and fixes:
- **Unused imports**: Remove unused imports or use `// biome-ignore`
- **Formatting**: Run `npm run qa:fix` to auto-format
- **Linting errors**: Fix manually or add appropriate ignores

#### TypeScript Build Failures

Common issues:
- **Type mismatches**: Check types and add proper annotations
- **Missing imports**: Add missing import statements
- **Missing properties**: Implement required interface properties

Analyze errors:
```bash
npm run build
```

#### Test Failures

Analyze test output:
```bash
npm run test
```

Common issues:
- **Assertion failures**: Fix the implementation or update test expectations
- **Missing mocks**: Add mocks for external dependencies
- **Async issues**: Handle promises correctly with `async/await`

### 4. Re-validate after fixes

Always run validation again after applying fixes:
```bash
npm run validate
```

### 5. Generate detailed reports (optional)

For detailed analysis, use related skills:
```bash
/analyze-quality-report  # For Biome issues
/analyze-test-report     # For test failures
/generate-coverage-report # For coverage analysis
```

## Output Analysis

### Success Output
```
✔ All checks passed
```

### Failure Output
```
✗ Biome check failed
✗ Build failed
✗ Tests failed
```

## Important Rules

- Never commit code that doesn't pass validation
- Fix all errors before marking tasks as complete
- Re-run validation after applying fixes
- Prioritize errors over warnings
- Provide actionable feedback for all issues

## Integration with Workflow

This skill integrates with:
- `analyze-quality-report` - For detailed Biome analysis
- `analyze-test-report` - For test failure analysis
- `create-git-commit` - Run validation before commits
- `kanban-task-executor` - Validation is part of task completion

## Notes

- All three checks must pass for validation to be considered successful
- This command runs all checks in parallel using `concurrently`
- Use this skill after any code modification before marking a task as complete
- This skill replaces and extends the deprecated `/quality-check` skill