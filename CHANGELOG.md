# History

This file tracks modifications to the AI Usage Monitor GNOME extension project.

## 2026

### 21/02

**[15:40:00] 📝 [DOCS]** Update README and metadata for multi-provider support
**[15:39:00] ✨ [FEAT]** Add OpenAI API usage provider (monthly costs by model)
**[15:38:00] ✨ [FEAT]** Update extension.js to read provider setting and pass to fetch script
**[15:37:00] ✨ [FEAT]** Update prefs.js with provider selector dropdown and dynamic credential fields
**[15:36:00] ✨ [FEAT]** Add provider and openai-api-key to GSettings schema
**[15:35:00] ♻️ [REFACTOR]** Refactor fetch-usage.ts into provider-based architecture (types.ts, providers/)
**[15:19:00] ✨ [FEAT]** Add custom symbolic gauge SVG icon for the GNOME extension panel
**[15:18:00] ✨ [FEAT]** Integrate custom icon into extension.js (gicon) and prefs.js (icon theme)
**[15:17:00] 🔧 [CHORE]** Update install.sh to copy icons directory during installation
**[15:14:00] 🔧 [CHORE]** Import Claude/Cline configuration from termaid project (skills, agents, rules, clinerules)
**[13:05:00] 🎨 [UX]** Rename project to "AI Usage Monitor"
**[11:45:00] 📝 [DOCS]** Add .claude/ rules, skills, and workflows structure inspired by termaid project
**[11:44:00] 📝 [DOCS]** Create KANBAN.md with initial backlog task
**[11:43:00] 📝 [DOCS]** Create README.md with project documentation
**[10:30:00] 🐛 [FIX]** Fix fetch-usage.ts to correctly parse Claude API usage data format
**[09:50:00] ✨ [FEAT]** Create GNOME Shell extension (metadata.json, extension.js, prefs.js, stylesheet.css)
**[09:45:00] ✨ [FEAT]** Create fetch-usage.ts script for scraping Claude.ai usage data
**[09:40:00] 🔧 [CHORE]** Initialize npm project with TypeScript and cheerio dependency
**[09:35:00] 🔧 [CHORE]** Create project structure and install.sh script