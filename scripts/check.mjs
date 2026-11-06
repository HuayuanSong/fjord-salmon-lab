import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

for (const directory of ["dist", "scripts", "test"]) {
  for (const file of readdirSync(directory).filter((name) =>
    name.endsWith(".mjs"),
  )) {
    const result = spawnSync(
      process.execPath,
      ["--check", `${directory}/${file}`],
      { stdio: "inherit" },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
