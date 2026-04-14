import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  ensureDemoPresetData,
  type LegacyLocalStore,
  type LocalStore,
  normalizeStore,
} from "@/server/local-domain";

export const dataDir = path.join(process.cwd(), "data");
export const seedPath = path.join(dataDir, "local-store.seed.json");
export const runtimePath = path.join(dataDir, "local-store.json");

let storeMutationQueue = Promise.resolve();

export async function ensureStoreFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(runtimePath, "utf8");
  } catch {
    await copyFile(seedPath, runtimePath);
  }
}

export async function readStore() {
  await ensureStoreFile();
  const content = await readFile(runtimePath, "utf8");
  const rawStore = JSON.parse(content) as LocalStore | LegacyLocalStore;

  return ensureDemoPresetData(normalizeStore(rawStore));
}

export async function writeStore(store: LocalStore) {
  const content = JSON.stringify(store, null, 2);
  const runtimeTempPath = path.join(dataDir, `local-store.${randomUUID()}.tmp.json`);

  await writeFile(runtimeTempPath, content);
  await rename(runtimeTempPath, runtimePath);
}

export async function mutateStore<T>(mutator: (store: LocalStore) => Promise<T> | T) {
  const run = storeMutationQueue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });

  storeMutationQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
}
