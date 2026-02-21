import type { Provider } from "../types.js";
import { claudeProvider } from "./claude.js";
import { openaiProvider } from "./openai.js";

const providers: Map<string, Provider> = new Map();

function register(provider: Provider): void {
  providers.set(provider.name, provider);
}

export function getProvider(name: string): Provider | undefined {
  return providers.get(name);
}

export function getAvailableProviders(): string[] {
  return Array.from(providers.keys());
}

// Register built-in providers
register(claudeProvider);
register(openaiProvider);
