import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const packageJson = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
const npmCli = process.env.npm_execpath;
if (!npmCli) {
    throw new Error("npm_execpath is required. Run this smoke through npm run package:smoke.");
}

const output = execFileSync(process.execPath, [npmCli, "pack", "--json", "--ignore-scripts"], {
    cwd: projectRoot,
    encoding: "utf8"
});
const [{ filename }] = JSON.parse(output);
const tarballPath = join(projectRoot, filename);
const root = await mkdtemp(join(tmpdir(), "canvas-mcp-package-"));

try {
    execFileSync(process.execPath, [npmCli, "install", "--ignore-scripts", tarballPath], {
        cwd: root,
        stdio: "inherit"
    });
    const installed = JSON.parse(
        await readFile(join(root, "node_modules", ...packageJson.name.split("/"), "package.json"), "utf8")
    );
    if (installed.version !== packageJson.version) {
        throw new Error(`Installed version ${installed.version} does not match ${packageJson.version}.`);
    }
    console.log(`Package smoke test passed for ${packageJson.name}@${packageJson.version}.`);
} finally {
    await rm(root, { recursive: true, force: true });
    await rm(tarballPath, { force: true });
}
