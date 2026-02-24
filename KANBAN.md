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
- [ ] **#doc-contributing [24/02/2026 09:43:14] 🟡 P2 🏗️ [ARCHITECTURE]** Add CONTRIBUTING.md with development workflow, commit conventions, and PR guidelines
- [ ] **#devops-templates [24/02/2026 09:43:14] 🟢 P3 🔧 [DEVOPS]** Add GitHub issue templates (bug report, feature request) and PR template
- [ ] **#devops-bump-version [23/02/2026 17:00:00] 🟡 P2 🔧 [DEVOPS]** Add bump-version script for automated version updates (package.json, README.md)
- [ ] **#test-coverage [23/02/2026 17:00:00] 🟡 P2 ✅ [TEST]** Configure vitest coverage with 80% thresholds (lines, functions, branches, statements)
- [ ] **#ux-credentials [23/02/2026 15:00:00] 🟢 P3 🎨 [UX]** Add credential validation with feedback in preferences dialog
- [ ] **#doc-dev [23/02/2026 15:00:00] 🟢 P3 🏗️ [ARCHITECTURE]** Add developer documentation in README (dev setup, running tests, architecture details)
- [ ] **#config-useragent [23/02/2026 15:00:00] 🟢 P3 ⚙️ [CONFIG]** Replace hardcoded User-Agent string with a dynamic or configurable value

## 🚧 In Progress

### [24/02/2026 09:47:21] 🟡 P2 🚀 [PERFORMANCE] Add timeout and cleanup for hung Node.js subprocesses
- [ ] **[24/02/2026 09:47:21] ✨ [FEAT]** Add subprocess timeout (60s) with GLib.timeout_add_seconds and force_exit in extension.js
- [ ] **[24/02/2026 09:47:21] ✨ [FEAT]** Add periodic cleanup of zombie subprocesses and max concurrent process limit

## ✅ Done

- [x] **[24/02/2026 10:05:00] ♻️ [REFACTOR]** Add typed error codes in fetch-usage.ts (distinguish auth_expired, network_error, timeout)
- [x] **[24/02/2026 10:05:00] ✨ [FEAT]** Update extension.js to display user-friendly error messages with icons based on error code
- [x] **[24/02/2026 09:47:21] 🔧 [CHORE]** Install wireit and configure scripts with file tracking and parallel execution
- [x] **[24/02/2026 09:47:21] ✅ [TEST]** Verify all wireit-wrapped scripts work correctly
- [x] **[24/02/2026 09:47:21] 🔧 [CHORE]** Create .editorconfig file
- [x] **[24/02/2026 09:47:21] 🎨 [STYLE]** Add badges to README
- [x] **[24/02/2026 09:47:21] 🔧 [CHORE]** Improve .gitignore with comprehensive patterns
- [x] **[24/02/2026 09:47:21] 🔧 [CHORE]** Add repository, bugs, homepage, keywords, author, license, engines fields to package.json
