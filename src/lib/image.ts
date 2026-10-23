/**
 * Prepares an uploaded clothing photo:
 * - scales it down (max 900 px) so storage stays small
 * - optionally makes a plain light background transparent, so the garment
 *   sits cleanly on the avatar
 * - trims empty space around the garment
 * Returns a PNG blob and the dominant colour of the garment.
 */
export async function processPhoto(file: File, removeBackground: boolean): Promise<{ blob: Blob; color: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image is too large (max 15 MB).");

  const img = await loadImage(file);
  const max = 900;
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Your browser can't process images.");
  ctx.drawImage(img, 0, 0, w, h);

  const data = ctx.getImageData(0, 0, w, h);
  if (removeBackground) removeLightBackground(data);
  ctx.putImageData(data, 0, 0);

  const color = dominantColor(data);
  const box = opaqueBounds(data) ?? { x: 0, y: 0, w, h };
  const out = document.createElement("canvas");
  out.width = box.w;
  out.height = box.h;
  out.getContext("2d")!.drawImage(canvas, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);

  const blob = await new Promise<Blob>((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not save image."))), "image/png")
  );
  return { blob, color };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image couldn't be opened."));
    };
    img.src = url;
  });
}

/** Flood-fills from the edges, clearing pixels close to the border colour. */
function removeLightBackground(img: ImageData) {
  const { width: w, height: h, data } = img;
  const corners = [0, w - 1, (h - 1) * w, h * w - 1].map((p) => [data[p * 4], data[p * 4 + 1], data[p * 4 + 2]]);
  const bg = corners.reduce((a, c) => [a[0] + c[0] / 4, a[1] + c[1] / 4, a[2] + c[2] / 4], [0, 0, 0]);
  const tol = 42;
  const near = (p: number) =>
    Math.abs(data[p * 4] - bg[0]) < tol && Math.abs(data[p * 4 + 1] - bg[1]) < tol && Math.abs(data[p * 4 + 2] - bg[2]) < tol;

  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop()!;
    if (seen[p] || !near(p)) continue;
    seen[p] = 1;
    data[p * 4 + 3] = 0;
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
}

function opaqueBounds(img: ImageData) {
  const { width: w, height: h, data } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function dominantColor(img: ImageData): string {
  const { data } = img;
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += r; e.g += g; e.b += b;
    buckets.set(key, e);
  }
  let best = { n: 0, r: 128, g: 128, b: 128 };
  for (const e of buckets.values()) if (e.n > best.n) best = e;
  const hex = (v: number) => Math.round(v / Math.max(1, best.n)).toString(16).padStart(2, "0");
  return best.n ? `#${hex(best.r)}${hex(best.g)}${hex(best.b)}` : "#8a8580";
}
