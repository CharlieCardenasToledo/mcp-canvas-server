import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { packageMetadata } from "../src/version.js";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { name: string; version: string };

test("runtime package metadata comes from package.json", () => {
    assert.equal(packageMetadata.name, packageJson.name);
    assert.equal(packageMetadata.version, packageJson.version);
});
