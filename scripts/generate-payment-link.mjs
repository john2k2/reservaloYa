import fs from "node:fs";
import path from "path";
import PocketBase from "pocketbase";
import { createPaymentPreference } from "../src/server/mercadopago.ts";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
for (const line of envContent.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const sep = t.indexOf("=");
  if (sep === -1) continue;
  process.env[t.slice(0, sep).trim()] = t.slice(sep + 1).trim();
}

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
  const pb = new PocketBase(PB_URL);
  await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

  const business = await pb.collection("businesses").getFirstListItem(
    pb.filter("slug = {:slug}", { slug: "bar-el-americano" })
  );

  const services = await pb.collection("services").getFullList({
    filter: pb.filter("business = {:business}", { business: business.id }),
  });

  const customers = await pb.collection("customers").getFullList({
    filter: pb.filter("business = {:business}", { business: business.id }),
  });

  if (services.length === 0 || customers.length === 0) {
    console.log("Necesitás tener servicios y clientes creados primero");
    return;
  }

  const booking = await pb.collection("bookings").create({
    business: business.id,
    customer: customers[0].id,
    service: services[0].id,
    bookingDate: "2026-03-25",
    startTime: "10:00",
    endTime: "10:30",
    status: "pending",
  });

  console.log("Booking creado:", booking.id);

  const result = await createPaymentPreference({
    bookingId: booking.id,
    businessSlug: "bar-el-americano",
    businessName: business.name,
    serviceName: services[0].name,
    customerEmail: customers[0].email,
    customerName: customers[0].fullName,
    priceAmount: services[0].price || 1500,
  });

  if (result.ok) {
    console.log("\n=== LINK DE PAGO ===");
    console.log("URL:", result.checkoutUrl);
    console.log("Preference ID:", result.preferenceId);
    console.log("====================\n");
  } else {
    console.error("Error:", result.error);
  }
}

main().catch(console.error);