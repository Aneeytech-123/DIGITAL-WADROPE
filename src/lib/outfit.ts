import { slotFor } from "./catalog";
import type { Category, Item, Look, Slot } from "./types";

/**
 * Puts an item on, following layering rules:
 * - one item per slot (a new top replaces the old top)
 * - a dress replaces both the top and the bottom, and vice versa
 * - clicking an item that is already worn takes it off
 */
export function wearItem(look: Look, item: Item): Look {
  const slot = slotFor(item);
  if (look[slot] === item.id) {
    return removeSlot(look, slot);
  }
  const next: Look = { ...look, [slot]: item.id };
  if (slot === "dress") {
    delete next.top;
    delete next.bottom;
  } else if (slot === "top" || slot === "bottom") {
    delete next.dress;
  }
  return next;
}

export function removeSlot(look: Look, slot: Slot): Look {
  const next = { ...look };
  delete next[slot];
  return next;
}

/** Drops ids that no longer exist in the wardrobe (e.g. after deleting an item). */
export function cleanLook(look: Look, items: Item[]): Look {
  const ids = new Set(items.map((i) => i.id));
  const next: Look = {};
  for (const [slot, id] of Object.entries(look) as [Slot, string][]) {
    if (id && ids.has(id)) next[slot] = id;
  }
  return next;
}

export function lookItems(look: Look, items: Item[]): Item[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  return Object.values(look)
    .map((id) => (id ? byId.get(id) : undefined))
    .filter((i): i is Item => Boolean(i));
}

export function isWearing(look: Look, itemId: string): boolean {
  return Object.values(look).includes(itemId);
}

/**
 * Builds a random but sensible outfit: either a dress or a top + bottom,
 * plus shoes, and sometimes outerwear and an accessory.
 * `rand` is injectable so the result can be tested.
 */
export function shuffleLook(items: Item[], rand: () => number = Math.random): Look {
  const pick = (cats: Category[]) => {
    const pool = items.filter((i) => cats.includes(i.category));
    return pool.length ? pool[Math.floor(rand() * pool.length)] : undefined;
  };
  let look: Look = {};
  const add = (item: Item | undefined) => {
    if (item) look = wearItem(look, item);
  };

  const hasDress = items.some((i) => i.category === "dresses");
  if (hasDress && rand() < 0.25) {
    add(pick(["dresses"]));
  } else {
    add(pick(["tops", "shirts"]));
    add(pick(["pants", "shorts", "skirts"]));
  }
  add(pick(["shoes"]));
  if (rand() < 0.45) add(pick(["outerwear"]));
  if (rand() < 0.6) add(pick(["accessories"]));
  return look;
}

/** Monday-first weekday index (0 = Monday ... 6 = Sunday). */
export function weekdayIndex(date: Date): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  return (((date.getDay() + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6);
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
