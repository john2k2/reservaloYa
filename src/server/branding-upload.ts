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

  const safeSlug = input.businessSlug.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const safeKind = input.kind.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "asset";
  const fileName = `${safeSlug}-${safeKind}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const relativePath = path.join("uploads", "branding", fileName);
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await input.file.arrayBuffer()));

  return `/${relativePath.replace(/\\/g, "/")}`;
}
