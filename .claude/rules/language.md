# Language Rule

## Objective

This rule ensures that all public content in the project is written in English for international accessibility and GitHub publication.

## Scope

All content in the project must be in English.

### Must be in English

- **Documentation files**: README.md, CHANGELOG.md, KANBAN.md, etc.
- **Code comments**: All comments in TypeScript, JavaScript, and other code files
- **Claude rules and workflows**: All files in `.claude/` directory
- **Test files**: All test descriptions, assertions, and comments
- **Configuration files**: .env.example, package.json descriptions, etc.
- **Git commit messages**: Must follow Conventional Commits in English (see commit_messages.md)
- **GNOME extension UI**: All labels and messages in the extension

### Technical terms

Technical terms and proper nouns should remain in their original language:
- Variable names, function names, class names
- API names, library names, framework names
- Brand names, product names
- Technical acronyms and abbreviations

## When to verify

After each file creation or modification:
1. Check that all text content is in English
2. Verify comments are in English
3. Ensure documentation follows English grammar and spelling

## Verification checklist

Before marking a task as complete, verify:

- [ ] All user-facing text is in English
- [ ] All code comments are in English
- [ ] Documentation files are in English
- [ ] Configuration file descriptions are in English
- [ ] Test descriptions and assertions are in English

## Impact on GitHub

This rule ensures:
- International contributors can understand the project
- The project is accessible to non-French speakers
- Consistent documentation across all files
- Professional appearance for open source publication