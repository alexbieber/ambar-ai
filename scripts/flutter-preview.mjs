import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const device = process.argv[2] || "chrome";
const webPort = process.env.FLUTTER_WEB_PORT || "7357";
const appDirArg = process.env.FLUTTER_APP_DIR || "";
const appDir = path.resolve(process.cwd(), appDirArg || ".");
const pubspecPath = path.join(appDir, "pubspec.yaml");
const mainPath = path.join(appDir, "lib", "main.dart");

if (!existsSync(pubspecPath) || !existsSync(mainPath)) {
  console.error("");
  console.error("Flutter project not found.");
  console.error("Set FLUTTER_APP_DIR to your Flutter app path and run again.");
  console.error("");
  console.error("Example:");
  console.error('  FLUTTER_APP_DIR="../my_flutter_app" npm run preview:flutter:web');
  console.error("");
  process.exit(1);
}

const runArgs =
  device === "chrome"
    ? ["run", "-d", "chrome", "--web-port", webPort]
    : ["run", "-d", device];

const pubGet = spawn("flutter", ["pub", "get"], {
  cwd: appDir,
  stdio: "inherit",
  shell: true,
});

pubGet.on("exit", (code) => {
  if (code !== 0) process.exit(code ?? 1);

  const run = spawn("flutter", runArgs, {
    cwd: appDir,
    stdio: "inherit",
    shell: true,
  });

  run.on("exit", (runCode) => process.exit(runCode ?? 0));
});
