import { spawn } from "node:child_process";

const projectRoot = process.cwd();
spawn("npx", ["next", "dev"], { cwd: projectRoot, env: process.env, stdio: "inherit" }).on("exit", (code) => process.exit(code ?? 1));
