---
name: run-tests
description: Execute unit tests with Vitest and generate coverage report. Use to verify code changes.
disable-model-invocation: false
---

# Skill: Run Tests

## Description

Execute the unit test suite using Vitest and generate a coverage report.

## Purpose

This skill runs the project's unit tests and provides detailed results including test failures and coverage information.

## Usage

Invoke this skill when you need to:
- Verify code changes don't break existing tests
- Run tests after implementing new features
- Generate coverage reports for analysis

## Execution Steps

1. Run the test command:
   ```bash
   npm run test
   ```

2. Wait for all tests to complete.

3. Analyze the output:
   - Count total tests run
   - Count passed/failed tests
   - List failed tests with error messages
   - Report coverage percentage if available

## Output Analysis

### Success Output
```
✓ All tests passed (N passed)
Coverage: XX%
```

### Failure Output
```
✗ Some tests failed (N passed, M failed)
Failed tests:
  - test_file.spec.ts > test_name
    Error: expected X to equal Y
```

## Options

Run tests with coverage:
```bash
npm run test -- --coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with UI:
```bash
npm run test:ui
```

## Error Handling

If tests fail:
1. Report which tests failed
2. Provide error messages for each failure
3. Suggest reviewing the failing test files
4. Indicate if coverage is below threshold

## Notes

- Tests are configured in `vitest.config.ts`
- Test files use `.test.ts` or `.spec.ts` suffix
- Tests run in Happy DOM environment
- Report test results in a clear, formatted way