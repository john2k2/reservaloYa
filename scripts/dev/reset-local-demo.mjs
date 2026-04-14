import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const seedPath = path.join(dataDir, "local-store.seed.json");
const runtimePath = path.join(dataDir, "local-store.json");

await mkdir(dataDir, { recursive: true });
await copyFile(seedPath, runtimePath);

console.log("Local demo data reset in data/local-store.json");
