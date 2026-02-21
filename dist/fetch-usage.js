"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("./providers/index.js");
async function main() {
    const provider = process.argv[2];
    const credential = process.argv[3];
    if (!provider || !credential) {
        const result = {
            status: "error",
            error_code: "missing_args",
            message: `Usage: node fetch-usage.js <provider> <credential>\nAvailable providers: ${(0, index_js_1.getAvailableProviders)().join(", ")}`,
        };
        console.log(JSON.stringify(result));
        process.exit(1);
    }
    const providerImpl = (0, index_js_1.getProvider)(provider);
    if (!providerImpl) {
        const result = {
            status: "error",
            error_code: "unknown_provider",
            message: `Unknown provider: ${provider}. Available: ${(0, index_js_1.getAvailableProviders)().join(", ")}`,
        };
        console.log(JSON.stringify(result));
        process.exit(1);
    }
    try {
        const usageResult = await providerImpl.fetchUsage(credential);
        if (usageResult) {
            console.log(JSON.stringify(usageResult));
            return;
        }
        const result = {
            status: "error",
            error_code: "auth_expired",
            message: "Could not retrieve usage data. The credential may be expired or invalid.",
        };
        console.log(JSON.stringify(result));
        process.exit(1);
    }
    catch (err) {
        const result = {
            status: "error",
            error_code: "fetch_error",
            message: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
        };
        console.log(JSON.stringify(result));
        process.exit(1);
    }
}
main();
