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

const user = await pb.collection("users").getFirstListItem(
  pb.filter("email = {:email}", { email: "negocio@ejemplo.com" })
);
console.log("User business:", user.business);
console.log("User role:", user.role);

const subs = await pb.collection("subscriptions").getFullList({ requestKey: null });
console.log("\nTodas las subscriptions:");
for (const sub of subs) {
  console.log("  ID:", sub.id);
  console.log("  business:", sub.business);
  console.log("  status:", sub.status);
  console.log("  trialEndsAt:", sub.trialEndsAt);
}

console.log("\n--- Verificando lógica de expiración ---");
console.log("Fecha hoy:", new Date().toISOString().split("T")[0]);
console.log("trialEndsAt configurado: 2026-03-01");
console.log("Es 2026-03-01 < hoy (2026-03-18)?", new Date("2026-03-01") < new Date());

const activeSub = subs.find(s => s.status === "trial" && s.trialEndsAt);
if (activeSub) {
  console.log("\nSubscription trial activa:", activeSub.id);
  console.log("trialEndsAt:", activeSub.trialEndsAt);
  console.log("Expirado?", new Date(activeSub.trialEndsAt) < new Date());
} else {
  console.log("\nNo hay subscription trial activa");
}