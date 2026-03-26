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

// Buscar subscription trial que no tiene business linkeado
const subs = await pb.collection("subscriptions").getFullList({ requestKey: null });
const trialSub = subs.find((s) => s.status === "trial" && s.trialEndsAt === "2026-03-01");

if (trialSub) {
  console.log("Subscription trial ID:", trialSub.id);
  console.log("Actual business link:", trialSub.business || trialSub.businessId);

  // Intentar actualizar linkeando al negocio
  try {
    await pb.collection("subscriptions").update(trialSub.id, {
      business: business.id,
    });
    console.log("OK: Subscription linkeada al negocio");
  } catch {
    console.log("No se pudo linkear con 'business', probando 'businessId'...");
    try {
      await pb.collection("subscriptions").update(trialSub.id, {
        businessId: business.id,
      });
      console.log("OK: Subscription linkeada con businessId");
    } catch (e2) {
      console.log("Error:", e2.message);
    }
  }
}

console.log("\nSubi a Vercel y despues:");
console.log("1. Hace logout si estas logueado");
console.log("2. Logueate en /admin con negocio@ejemplo.com / Password123!");
console.log("3. Deberia redirigirte a /admin/subscription");
