import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const expectedTag = `v${packageJson.version}`;
const suppliedTag = process.env.RELEASE_TAG || process.argv[2];

// Release Please uses "<package-name>-v<version>" for scoped packages.
// Accept both "v1.2.3" and "@scope/pkg-v1.2.3" as equivalent.
const normalizedTag = suppliedTag ? suppliedTag.replace(/^.*-v/, "v") : suppliedTag;

if (normalizedTag && normalizedTag !== expectedTag) {
    throw new Error(`Release tag ${suppliedTag} does not match package version ${expectedTag}.`);
}

if (!packageJson.mcpName || !packageJson.repository?.url || packageJson.publishConfig?.access !== "public") {
    throw new Error("package.json is missing MCP registry, repository, or public publishing metadata.");
}

console.log(`Release metadata valid for ${expectedTag}.`);
