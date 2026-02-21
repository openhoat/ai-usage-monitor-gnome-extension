---
name: analyze-test-report
description: Analyze Vitest test results and coverage. Use after npm run test to understand failures.
disable-model-invocation: false
---

# Skill: Analyze Test Report

## Description

Analyze Vitest test results and provide detailed insights on test failures and coverage.

## Purpose

This skill processes test output to identify failing tests, coverage gaps, and provides recommendations.

## Usage

Invoke this skill after running `npm run test` or `npm run validate` when test failures are detected.

## Execution Steps

1. Review the Vitest test output.

2. Extract test statistics:
   - Total number of tests
   - Passed tests count
   - Failed tests count
   - Skipped tests count
   - Test execution time

3. Analyze failed tests:
   - List each failing test with file path and test name
   - Extract error messages and stack traces
   - Identify common patterns in failures

4. Review coverage if available:
   - Overall coverage percentage
   - Coverage by file
   - Uncovered lines and branches
   - Critical files with low coverage

5. Generate a comprehensive report.

## Output Format

```
Test Report Summary
===================
Total Tests: N
Passed: N | Failed: N | Skipped: N
Execution Time: X.XXs

Failed Tests:
1. path/to/test.spec.ts > test name
   Error: expected X to equal Y
   Stack: path/to/file.ts:XX:XX

Coverage Report:
Overall: XX%
- Lines: XX%
- Branches: XX%
- Functions: XX%

Low Coverage Files:
- path/to/file.ts: XX% coverage

Recommendations:
1. Fix failed tests in path/to/test.spec.ts
2. Improve coverage for low-coverage files
3. Consider adding edge case tests
```

## Error Handling

If tests fail:
1. Prioritize failing tests over coverage issues
2. Group similar failures together
3. Suggest reviewing the implementation for failing tests
4. Check for broken dependencies or test setup issues

## Notes

- Tests use Happy DOM environment
- Test files follow `.test.ts` or `.spec.ts` naming
- Coverage configuration is in `vitest.config.ts`
- Use this skill to understand test failures and coverage gaps