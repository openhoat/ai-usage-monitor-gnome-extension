# Kanban Board

**Priority Legend:**
- 🔴 **P1** = High Priority (critical, security, blocking issues)
- 🟡 **P2** = Medium Priority (important improvements)
- 🟢 **P3** = Low Priority (nice to have, enhancements)

**Category Icons (for Ideas):**
- 🔒 **[SECURITY]**: Security improvements
- ✅ **[TEST]**: Testing improvements
- 🚀 **[PERFORMANCE]**: Performance optimizations
- 🏗️ **[ARCHITECTURE]**: Code architecture improvements
- 🎨 **[UX]**: User experience improvements
- 🔧 **[DEVOPS]**: DevOps improvements
- 🌍 **[I18N]**: Internationalization improvements
- 📦 **[DEPENDENCIES]**: Dependency updates
- ⚙️ **[CONFIG]**: Configuration improvements

## 📝 Backlog

- [ ] **#devops-cicd [23/02/2026 15:00:00] 🔴 P1 🔧 [DEVOPS]** Setup GitHub Actions CI/CD pipeline (build, lint, tests on commits/PR)
- [ ] **#devops-wireit [23/02/2026 17:00:00] 🟡 P2 🚀 [PERFORMANCE]** Add wireit for npm scripts caching and parallelization (build, test, validate)
- [ ] **#devops-bump-version [23/02/2026 17:00:00] 🟡 P2 🔧 [DEVOPS]** Add bump-version script for automated version updates (package.json, README.md)
- [ ] **#test-coverage [23/02/2026 17:00:00] 🟡 P2 ✅ [TEST]** Configure vitest coverage with 80% thresholds (lines, functions, branches, statements)
- [ ] **#doc-badges [23/02/2026 17:00:00] 🟢 P3 🎨 [UX]** Add README badges (License, TypeScript, Node.js, Vitest, GitHub Stars/Forks/Issues)
- [ ] **#ux-errors [23/02/2026 15:00:00] 🟡 P2 🎨 [UX]** Improve error messages in extension UI to distinguish between invalid credentials, network errors, and timeouts
- [ ] **#perf-subprocess [23/02/2026 15:00:00] 🟡 P2 🚀 [PERFORMANCE]** Add timeout and cleanup for hung Node.js subprocesses in extension.js
- [ ] **#ux-credentials [23/02/2026 15:00:00] 🟢 P3 🎨 [UX]** Add credential validation with feedback in preferences dialog
- [ ] **#doc-dev [23/02/2026 15:00:00] 🟢 P3 🏗️ [ARCHITECTURE]** Add developer documentation in README (dev setup, running tests, architecture details)
- [ ] **#config-useragent [23/02/2026 15:00:00] 🟢 P3 ⚙️ [CONFIG]** Replace hardcoded User-Agent string with a dynamic or configurable value

## 🚧 In Progress


## ✅ Done

- [x] **[24/02/2026 09:37:00] ✨ [FEAT]** Create `fetchWithRetry` utility with exponential backoff (3 retries, network errors and 5xx only)
- [x] **[24/02/2026 09:37:00] ♻️ [REFACTOR]** Apply `fetchWithRetry` to all providers (Claude, OpenAI, Ollama)
- [x] **[24/02/2026 09:37:00] ✅ [TEST]** Add unit tests for `fetchWithRetry` utility
- [x] **[24/02/2026 09:33:00] ✅ [TEST]** Add unit tests for Claude provider (API endpoint flow, scraping fallback, error handling)
- [x] **[24/02/2026 09:33:00] ✅ [TEST]** Add unit tests for OpenAI provider (costs API, subscription API, pagination, error handling)
- [x] **[24/02/2026 09:25:00] 🔧 [CHORE]** Remove unused @testing-library/react dependency
- [x] **[24/02/2026 09:21:09] ✨ [FEAT]** Create `fetchWithTimeout` utility function with AbortController and configurable timeout
- [x] **[24/02/2026 09:21:09] ♻️ [REFACTOR]** Apply `fetchWithTimeout` to all providers (Claude, OpenAI, Ollama)
- [x] **[24/02/2026 09:21:09] ✅ [TEST]** Add unit tests for `fetchWithTimeout` utility
- [x] **[23/02/2026 19:35:00] ✨ [FEAT]** Display last refresh time in extension widget menu (store timestamp on fetch, show "Last updated: HH:MM")
