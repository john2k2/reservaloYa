#!/usr/bin/env node
/**
 * Backup manual de PocketBase → Vercel Blob.
 * Retiene los últimos 30 días; borra los anteriores.
 *
 * Uso:
 *   node --env-file=.env.production.local scripts/ops/backup-pocketbase.mjs
 *
 * Vars requeridas:
 *   NEXT_PUBLIC_POCKETBASE_URL
 *   POCKETBASE_ADMIN_EMAIL
 *   POCKETBASE_ADMIN_PASSWORD
 *   BLOB_READ_WRITE_TOKEN
 */

import { put, list, del } from "@vercel/blob";
import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const PB_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const PB_PASS = process.env.POCKETBASE_ADMIN_PASSWORD;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const RETENTION_DAYS = 30;
const BLOB_PREFIX = "backups/pb/";

async function runBackup() {
  if (!PB_URL || !PB_EMAIL || !PB_PASS) {
    throw new Error(
      "Faltan env vars: NEXT_PUBLIC_POCKETBASE_URL / POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD"
    );
  }
  if (!BLOB_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN no está configurado");
  }

  // 1. Auth como superuser
  const pb = new PocketBase(PB_URL);
  await pb.collection("_superusers").authWithPassword(PB_EMAIL, PB_PASS);
  console.log("✓ Autenticado en PocketBase");

  // 2. Crear backup en PB
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const backupName = `auto-${timestamp}.zip`;
  await pb.backups.create(backupName);
  console.log(`✓ Backup creado: ${backupName}`);

  // 3. Descargar el zip
  const fileToken = await pb.files.getToken();
  const downloadUrl = `${PB_URL}/api/backups/${backupName}?token=${fileToken}`;
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Descarga fallida: ${res.status} ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`✓ Descargado: ${(buffer.length / 1024).toFixed(1)} KB`);

  // 4. Subir a Vercel Blob
  const blobPath = `${BLOB_PREFIX}${backupName}`;
  const uploaded = await put(blobPath, buffer, {
    access: "private",
    contentType: "application/zip",
    token: BLOB_TOKEN,
    addRandomSuffix: true,
  });
  console.log(`✓ Subido a Blob privado: ${uploaded.pathname}`);

  // 5. Borrar backup de PB
  await pb.backups.delete(backupName);
  console.log("✓ Backup eliminado de PB (ya está en Blob)");

  // 6. Purgar backups viejos (>30 días)
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const { blobs } = await list({ prefix: BLOB_PREFIX, token: BLOB_TOKEN });
  const toDelete = blobs.filter((b) => new Date(b.uploadedAt).getTime() < cutoff);
  for (const old of toDelete) {
    await del(old.pathname, { token: BLOB_TOKEN });
  }
  if (toDelete.length > 0) {
    console.log(`✓ Purgados ${toDelete.length} backup(s) viejos`);
  }

  return {
    backupPath: uploaded.pathname,
    size: buffer.length,
    purged: toDelete.length,
    access: "private",
  };
}

runBackup()
  .then((r) => {
    console.log("\nBackup OK:", JSON.stringify(r, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error("\nBackup FALLÓ:", e.message);
    process.exit(1);
  });
