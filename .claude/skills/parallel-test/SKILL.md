---
name: parallel-test
description: Run tests for multiple modules in parallel using subagents. Use for faster test execution.
disable-model-invocation: false
---

# Skill: Parallel Testing

Run tests for multiple modules in parallel using Task subagents.

## Execution Steps

### 1. Identify testable modules

Find independent test files in the project:
- `src/services/*.test.ts`
- `src/components/*.test.tsx`
- `electron/**/*.test.ts`

### 2. Launch parallel test subagents

For each independent test suite, launch a subagent:

```javascript
Task({
  description: "Test chatService",
  prompt: "Run tests for chatService.test.ts with coverage. Report any failures.",
  subagent_type: "Bash"
})
```

Launch multiple in parallel for different modules.

### 3. Aggregate results

Wait for all subagents to complete and collect results.

### 4. Generate report

```
🧪 Parallel Test Results
========================

Test Suites Executed: N

Suite 1: chatService.test.ts
Status: ✅ Passed
Tests: N/N passed
Coverage: XX%

Suite 2: terminalService.test.ts
Status: ✅ Passed
Tests: N/N passed
Coverage: XX%

Overall Summary:
- Total Tests: N
- Passed: N
- Failed: N
- Overall Coverage: XX%
```

## When to Use

- Testing multiple independent modules
- Need faster test execution
- Checking test coverage across components

## Important Rules

- Only launch subagents for independent test suites
- Each subagent should test a different module
- Wait for all subagents to complete before reporting
- Aggregate results into a single report

## Example

Running tests for all services in parallel:
1. Test chatService.test.ts
2. Test terminalService.test.ts
3. Test configService.test.ts

All three run simultaneously, significantly reducing total execution time.