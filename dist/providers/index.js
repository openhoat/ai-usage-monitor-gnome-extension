"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvider = getProvider;
exports.getAvailableProviders = getAvailableProviders;
const claude_js_1 = require("./claude.js");
const openai_js_1 = require("./openai.js");
const providers = new Map();
function register(provider) {
    providers.set(provider.name, provider);
}
function getProvider(name) {
    return providers.get(name);
}
function getAvailableProviders() {
    return Array.from(providers.keys());
}
// Register built-in providers
register(claude_js_1.claudeProvider);
register(openai_js_1.openaiProvider);
