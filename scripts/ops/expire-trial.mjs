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

const business = await pb.collection("businesses").getFirstListItem(
  pb.filter("slug = {:slug}", { slug: "bar-el-americano" })
);
console.log("Business ID:", business.id);

const subs = await pb.collection("subscriptions").getFullList({ requestKey: null });
console.log("Total subscriptions:", subs.totalItems || subs.length);

for (const sub of subs) {
  console.log("\nSubscription:", sub.id);
  console.log("  business:", sub.business);
  console.log("  status:", sub.status);
  console.log("  trialEndsAt:", sub.trialEndsAt);
  console.log("  all fields:", Object.keys(sub));
}

const mySub = subs.find(s => s.business === business.id || s.business?.id === business.id);
if (mySub) {
  console.log("\n>>> Actualizando trial...");
  await pb.collection("subscriptions").update(mySub.id, {
    status: "trial",
    trialEndsAt: "2026-03-01",
  });
  console.log("Trial expirado!");
} else {
  console.log("\n>>> Creando subscription...");
  await pb.collection("subscriptions").create({
    business: business.id,
    status: "trial",
    trialEndsAt: "2026-03-01",
  });
  console.log("Subscription creada!");
}

console.log("\nIniciá sesión en /admin con:");
console.log("Email: negocio@ejemplo.com");
console.log("Password: Password123!");