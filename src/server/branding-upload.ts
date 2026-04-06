import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type SaveBrandingImageInput = {
  file: FormDataEntryValue | null;
  businessSlug: string;
  kind: string;
};

function buildFileName(slug: string, kind: string, extension: string): string {
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const safeKind = kind.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "asset";
  return `${safeSlug}-${safeKind}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
}

async function saveToBlob(file: File, fileName: string): Promise<string> {
  // @vercel/blob — requiere BLOB_READ_WRITE_TOKEN en env
  const { put } = await import("@vercel/blob");
  const blob = await put(`branding/${fileName}`, file, {
    access: "public",
    contentType: file.type,
  });
  return blob.url;
}

async function saveToFilesystem(file: File, fileName: string): Promise<string> {
  const relativePath = path.join("uploads", "branding", fileName);
  const absolutePath = path.join(process.cwd(), "public", relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));
  return `/${relativePath.replace(/\\/g, "/")}`;
}

export async function saveBrandingImageUpload(
  input: SaveBrandingImageInput
): Promise<string | null> {
  if (!(input.file instanceof File) || input.file.size === 0) {
    return null;
  }

  if (input.file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("La imagen supera el limite de 5MB.");
  }

  const extension = ALLOWED_MIME_TYPES[input.file.type];

  if (!extension) {
    throw new Error("Formato de imagen no soportado. Usa JPG, PNG o WEBP.");
  }

  const fileName = buildFileName(input.businessSlug, input.kind, extension);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return saveToBlob(input.file, fileName);
  }

  // Fallback para desarrollo local — no persiste entre deploys en Vercel
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN no está configurado. Las imágenes de branding requieren Vercel Blob en producción."
    );
  }

  return saveToFilesystem(input.file, fileName);
}
