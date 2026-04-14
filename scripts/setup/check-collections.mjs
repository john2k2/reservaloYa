import fs from "node:fs";
import path from "path";
import PocketBase from "pocketbase";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env.local");

async function loadEnv() {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const sep = t.indexOf("=");
    if (sep === -1) continue;
    process.env[t.slice(0, sep).trim()] = t.slice(sep + 1).trim();
  }
}

await loadEnv();

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
await pb.collection("_superusers").authWithPassword(
  process.env.POCKETBASE_ADMIN_EMAIL,
  process.env.POCKETBASE_ADMIN_PASSWORD
);

const collections = await pb.collections.getFullList();
console.log("Colecciones disponibles:");
for (const col of collections) {
  console.log(" -", col.name, "(ID:", col.id + ")");
}

const users = await pb.collection("users").getList(1, 1, {});
console.log("\nUsers total:", users.totalItems);