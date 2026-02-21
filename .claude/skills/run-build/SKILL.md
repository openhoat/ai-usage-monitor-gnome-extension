---
name: run-build
description: Build the project (Vite frontend and Electron backend). Use to verify compilation.
disable-model-invocation: false
---

# Skill: Run Build

## Description

Build the project including Vite frontend and Electron backend.

## Purpose

This skill compiles the TypeScript code for both the frontend (Vite) and backend (Electron) components.

## Usage

Invoke this skill when you need to:
- Verify code compiles without TypeScript errors
- Prepare the project for distribution
- Check type safety across the codebase

## Execution Steps

1. Run the build command:
   ```bash
   npm run build
   ```

2. Wait for the build to complete.

3. Analyze the output:
   - Check if Vite build succeeded
   - Check if Electron build succeeded
   - Report any TypeScript errors or warnings

## Output Analysis

### Success Output
```
✓ Vite build completed
✓ Electron build completed
Build artifacts in: dist/, dist-electron/
```

### Failure Output
```
✗ Build failed
Error: TS2307: Cannot find module 'module-name'
```

## Build Process

The build command runs:
1. `npm run build:vite` - Build React frontend with Vite
2. `npm run build:electron` - Compile Electron TypeScript

## Error Handling

If build fails:
1. Identify whether it's Vite or Electron build failure
2. Report TypeScript errors with file locations
3. Check for missing dependencies or type definitions
4. Suggest running `tsc` for detailed error information

## Notes

- TypeScript configuration is in `tsconfig.json` and `electron/tsconfig.json`
- Build artifacts go to `dist/` (frontend) and `dist-electron/` (backend)
- The build includes prompt file copying for Electron
- Use this skill before deployment to ensure compilation succeeds