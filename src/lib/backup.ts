import { getPhoto, putPhoto } from "./db";
import type { AppData } from "./types";

interface Backup {
  app: "digital-wardrobe";
  exportedAt: string;
  data: AppData;
  photos: Record<string, string>;
}

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

/** Downloads a JSON backup of the wardrobe, including photos. */
export async function exportBackup(data: AppData): Promise<void> {
  const photos: Record<string, string> = {};
  for (const item of data.items) {
    if (item.photoId) {
      const blob = await getPhoto(item.photoId);
      if (blob) photos[item.photoId] = await toDataUrl(blob);
    }
  }
  const backup: Backup = { app: "digital-wardrobe", exportedAt: new Date().toISOString(), data, photos };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `digital-wardrobe-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Reads a backup file and restores its photos; returns the app data. */
export async function importBackup(file: File): Promise<AppData> {
  let parsed: Backup;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("That file isn't a valid backup.");
  }
  if (parsed?.app !== "digital-wardrobe" || parsed.data?.version !== 1 || !Array.isArray(parsed.data.items)) {
    throw new Error("That file isn't a Digital Wardrobe backup.");
  }
  for (const [id, dataUrl] of Object.entries(parsed.photos ?? {})) {
    if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/")) {
      const blob = await (await fetch(dataUrl)).blob();
      await putPhoto(id, blob);
    }
  }
  return parsed.data;
}
