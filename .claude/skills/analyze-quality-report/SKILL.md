---
name: analyze-quality-report
description: Analyze Biome linting and formatting report. Use after npm run qa to understand issues.
disable-model-invocation: false
---

# Skill: Analyze Quality Report

## Description

Analyze Biome linting and formatting report and provide actionable recommendations.

## Purpose

This skill processes Biome quality check output and identifies code quality issues.

## Usage

Invoke this skill after running `npm run qa` or `npm run validate` when quality issues are detected.

## Execution Steps

1. Review the Biome output from the quality check.

2. Categorize issues by type:
   - Linting errors (unsafe code, unused variables, etc.)
   - Formatting issues (indentation, spacing, etc.)
   - Complexity issues (functions too long, cyclomatic complexity)
   - Suspicious code patterns

3. For each issue:
   - Identify the file and line number
   - Classify the severity (error, warning, suggestion)
   - Summarize the issue description
   - Determine if auto-fix is available

4. Generate a report with:
   - Total number of issues
   - Issues by file
   - Issues by severity
   - Recommended actions

## Output Format

```
Quality Report Summary
======================
Total Issues: N

By Severity:
- Errors: N
- Warnings: N
- Suggestions: N

Files with Issues:
- path/to/file.ts (N issues)
  - Line XX: error description
  - Line YY: warning description

Recommendations:
1. Run `npm run qa:fix` to auto-fix formatting and linting issues
2. Manually review and fix remaining errors
3. Focus on severity errors first
```

## Error Handling

If quality report shows errors:
1. List all files with errors
2. Prioritize errors over warnings
3. Suggest using `npm run qa:fix` for auto-fixable issues
4. Provide guidance for manual fixes

## Notes

- Biome configuration is in `biome.json`
- Auto-fix is available for most linting and formatting issues
- Critical errors should be fixed before committing
- Use this skill to understand quality issues in the codebase