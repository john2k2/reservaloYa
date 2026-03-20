import fs from "node:fs/promises";
import path from "node:path";
import PocketBase from "pocketbase";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env.local");

async function loadEnvFile() {
  try {
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const sep = trimmed.indexOf("=");
      if (sep === -1) continue;
      const key = trimmed.slice(0, sep).trim();
      const value = trimmed.slice(sep + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch { /* ignore */ }
}

await loadEnvFile();

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase-production-f360.up.railway.app";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Faltan credenciales de admin en .env.local");
  process.exit(1);
}

const pb = new PocketBase(PB_URL);

async function main() {
  await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

  const ownerEmail = "negocio@ejemplo.com";
  const ownerPassword = "Password123!";
  const ownerName = "Juan Perez";
  const businessName = "Bar El Americano";
  const businessSlug = "bar-el-americano";
  const phone = "+541111111111";
  const address = "Calle Falsa 123, Buenos Aires";

  const existingUser = await pb.collection("users").getList(1, 1, {
    filter: pb.filter("email = {:email}", { email: ownerEmail }),
  }).catch(() => null);

  if (existingUser && existingUser.totalItems > 0) {
    console.log("Ya existe un usuario con ese email:", ownerEmail);
    return;
  }

  const existingBusiness = await pb.collection("businesses").getList(1, 1, {
    filter: pb.filter("slug = {:slug}", { slug: businessSlug }),
  }).catch(() => null);

  if (existingBusiness && existingBusiness.totalItems > 0) {
    console.log("Ya existe un negocio con ese slug:", businessSlug);
    return;
  }

  const business = await pb.collection("businesses").create({
    name: businessName,
    slug: businessSlug,
    templateSlug: "demo-barberia",
    phone,
    email: ownerEmail,
    address,
    timezone: "America/Argentina/Buenos_Aires",
    active: true,
  });

  console.log("Negocio creado:", business.name, "- ID:", business.id);

  const services = [
    { name: "Corte de pelo", description: "Corte clásico", durationMinutes: 30, price: 1500 },
    { name: "Barba", description: "Arreglo de barba", durationMinutes: 20, price: 800 },
    { name: "Corte + Barba", description: "Paquete completo", durationMinutes: 50, price: 2000 },
  ];

  for (const service of services) {
    await pb.collection("services").create({
      business: business.id,
      ...service,
      active: true,
    });
  }
  console.log("Servicios creados:", services.length);

  const availabilityRules = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", active: true },
    { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", active: true },
    { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", active: true },
    { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", active: true },
    { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", active: true },
    { dayOfWeek: 6, startTime: "10:00", endTime: "14:00", active: true },
  ];

  for (const rule of availabilityRules) {
    await pb.collection("availability_rules").create({
      business: business.id,
      ...rule,
    });
  }
  console.log("Horarios creados");

  const trialDays = 15;
  const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  await pb.collection("users").create({
    email: ownerEmail,
    password: ownerPassword,
    passwordConfirm: ownerPassword,
    name: ownerName,
    business: business.id,
    role: "owner",
    active: true,
    verified: true,
  });

  console.log("\n=== CUENTA CREADA ===");
  console.log("Email:", ownerEmail);
  console.log("Password:", ownerPassword);
  console.log("Negocio:", businessName);
  console.log("Slug:", businessSlug);
  console.log("========================\n");
  console.log("Podés iniciar sesión en:", PB_URL, "/_/");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});