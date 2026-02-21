---
name: generate-coverage-report
description: Generate detailed code coverage report with Vitest. Use to analyze test coverage.
disable-model-invocation: false
---

# Skill: Generate Coverage Report

## Description

Generate a detailed code coverage report using Vitest.

## Purpose

This skill runs tests with coverage enabled and produces a comprehensive coverage report.

## Usage

Invoke this skill when you need to:
- Review test coverage across the codebase
- Identify untested code
- Generate coverage reports for analysis

## Execution Steps

1. Run tests with coverage:
   ```bash
   npm run test -- --coverage
   ```

2. Wait for tests to complete and coverage to be generated.

3. Analyze the coverage output:
   - Overall coverage percentage
   - Coverage by metric (lines, branches, functions, statements)
   - Coverage by file
   - Uncovered lines and branches

4. Generate a structured report highlighting:
   - Files with 100% coverage
   - Files needing improvement (< 80% coverage)
   - Files with low coverage (< 50% coverage)
   - Critical files with insufficient coverage

## Output Format

```
Coverage Report Summary
=======================
Overall Coverage: XX%
- Lines: XX%
- Branches: XX%
- Functions: XX%
- Statements: XX%

Files by Coverage Level:

Excellent Coverage (100%):
- path/to/file.ts

Good Coverage (80-99%):
- path/to/another.ts: 85%

Needs Improvement (50-79%):
- path/to/low.ts: 65%

Low Coverage (< 50%):
- path/to/critical.ts: 30% ⚠️

Recommendations:
1. Add tests for uncovered lines in low coverage files
2. Focus on critical files with insufficient coverage
3. Test edge cases and branches
```

## Coverage Directories

Coverage reports are generated in:
- HTML report: `coverage/index.html`
- Console output: displayed in terminal

## Error Handling

If coverage generation fails:
1. Check if test files exist
2. Verify vitest configuration
3. Check for dependency issues

## Notes

- Coverage thresholds can be configured in `vitest.config.ts`
- HTML report provides detailed line-by-line coverage
- Use this skill to track test coverage over time
- Aim for 80%+ coverage on production code