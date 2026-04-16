import { put, list, del } from "@vercel/blob";
import PocketBase from "pocketbase";

import { createLogger } from "@/server/logger";

const logger = createLogger("PB Backup");

const RETENTION_DAYS = 30;
const BLOB_PREFIX = "backups/pb/";

export type BackupResult = {
  backupPath: string;
  size: number;
  purged: number;
  access: "private";
};

export async function runBackup(): Promise<BackupResult> {
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
  const pbEmail = process.env.POCKETBASE_ADMIN_EMAIL;
  const pbPass = process.env.POCKETBASE_ADMIN_PASSWORD;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!pbUrl || !pbEmail || !pbPass) {
    throw new Error(
      "Faltan env vars de PocketBase: NEXT_PUBLIC_POCKETBASE_URL / POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD"
    );
  }

  if (!blobToken) {
    throw new Error("BLOB_READ_WRITE_TOKEN no está configurado");
  }

  // 1. Auth como superuser
  const pb = new PocketBase(pbUrl);
  await pb.collection("_superusers").authWithPassword(pbEmail, pbPass);
  logger.info("Autenticado en PocketBase");

  // 2. Crear backup en PB
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const backupName = `auto-${timestamp}.zip`;
  await pb.backups.create(backupName);
  logger.info("Backup creado en PB", { backupName });

  // 3. Descargar el zip
  const fileToken = await pb.files.getToken();
  const downloadUrl = `${pbUrl}/api/backups/${backupName}?token=${fileToken}`;
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(`Descarga fallida: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  logger.info("Backup descargado", { bytes: buffer.length });

  // 4. Subir a Vercel Blob
  const blobPath = `${BLOB_PREFIX}${backupName}`;
  const uploaded = await put(blobPath, buffer, {
    access: "private",
    contentType: "application/zip",
    token: blobToken,
    addRandomSuffix: true,
  });
  logger.info("Subido a Vercel Blob", {
    pathname: uploaded.pathname,
    access: "private",
  });

  // 5. Borrar backup de PB (ya está en Blob, no ocupar espacio en Railway)
  await pb.backups.delete(backupName);
  logger.info("Backup eliminado de PB");

  // 6. Purgar backups viejos en Blob (>30 días)
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const { blobs } = await list({ prefix: BLOB_PREFIX, token: blobToken });
  const toDelete = blobs.filter(
    (b) => new Date(b.uploadedAt).getTime() < cutoff
  );

  for (const old of toDelete) {
    await del(old.pathname, { token: blobToken });
  }

  if (toDelete.length > 0) {
    logger.info("Backups viejos purgados", { count: toDelete.length });
  }

  return {
    backupPath: uploaded.pathname,
    size: buffer.length,
    purged: toDelete.length,
    access: "private",
  };
}
