#!/usr/bin/env node
/**
 * Habilita trials de manera batch para múltiples cuentas.
 *
 * Uso:
 *   node scripts/ops/enable-feedback-trials.mjs --emails a@test.com,b@test.com --days 90
 *
 * Args:
 *   --emails  Lista de emails separados por coma
 *   --days    Días de trial (default: 90)
 */

import PocketBase from "pocketbase";

const args = process.argv.slice(2);
let emails = [];
let days = 90;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--emails" && args[i + 1]) {
    emails = args[i + 1].split(",").map((e) => e.trim());
    i++;
  } else if (args[i] === "--days" && args[i + 1]) {
    days = parseInt(args[i + 1], 10);
    i++;
  }
}

if (emails.length === 0) {
  console.error("Uso: node scripts/ops/enable-feedback-trials.mjs --emails a@test.com,b@test.com --days 90");
  process.exit(1);
}

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase-production-f360.up.railway.app";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Faltan POCKETBASE_ADMIN_EMAIL y/o POCKETBASE_ADMIN_PASSWORD en .env.local");
  process.exit(1);
}

async function enableTrialForEmail(pb, email, days) {
  try {
    const users = await pb.collection("users").getList(1, 1, {
      filter: pb.filter("email = {:email} && role = 'owner'", { email }),
    });

    if (users.totalItems === 0) {
      return { email, success: false, error: "Usuario no encontrado o no es owner" };
    }

    const user = users.items[0];
    const businessId = Array.isArray(user.business) ? user.business[0] : user.business;

    if (!businessId) {
      return { email, success: false, error: "Usuario sin negocio asociado" };
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    const existingSubs = await pb.collection("subscriptions").getList(1, 1, {
      filter: pb.filter("businessId = {:businessId}", { businessId }),
    });

    if (existingSubs.totalItems > 0) {
      await pb.collection("subscriptions").update(existingSubs.items[0].id, {
        status: "trial",
        trialStartedAt: now.toISOString(),
        trialEndsAt,
        lockedAt: null,
      });
    } else {
      await pb.collection("subscriptions").create({
        businessId,
        status: "trial",
        trialStartedAt: now.toISOString(),
        trialEndsAt,
        lockedAt: null,
      });
    }

    return { email, success: true, businessId, trialEndsAt: trialEndsAt };
  } catch (err) {
    return { email, success: false, error: err.message };
  }
}

async function main() {
  const pb = new PocketBase(PB_URL);
  await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

  console.log(`Habilitando trial de ${days} días para ${emails.length} cuenta(s)...\n`);

  const results = [];
  for (const email of emails) {
    const result = await enableTrialForEmail(pb, email, days);
    results.push(result);

    if (result.success) {
      console.log(`✅ ${email} → trial habilitado hasta ${new Date(result.trialEndsAt).toLocaleDateString("es-AR")}`);
    } else {
      console.log(`❌ ${email} → ${result.error}`);
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`\nResultado: ${succeeded} éxito(s), ${failed} error(es)`);

  await pb.authStore.clear();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});