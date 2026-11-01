import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const vinext = path.join(projectRoot, "node_modules", "vinext", "dist", "cli.js");
const timeoutMs = Number(process.env.SITES_BUILD_TIMEOUT_MS || 180000);

try {
  await access(vinext);
} catch {
  console.error("vinext is unavailable. Run npm install before building.");
  process.exit(69);
}

console.log("Running bounded vinext build...");
const child = spawn(process.execPath, [vinext, "build"], {
  cwd: projectRoot,
  env: { ...process.env, SITES_PROJECT_ROOT: projectRoot },
  stdio: "inherit",
});
const timer = setTimeout(() => {
  console.error(`Build exceeded ${Math.round(timeoutMs / 1000)} seconds.`);
  child.kill("SIGTERM");
}, timeoutMs);

child.on("error", error => {
  clearTimeout(timer);
  console.error(error.message);
  process.exit(1);
});
child.on("exit", (code, signal) => {
  clearTimeout(timer);
  process.exit(code ?? (signal ? 1 : 0));
});
