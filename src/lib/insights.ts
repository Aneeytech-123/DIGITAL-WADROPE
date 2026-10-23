import { CATEGORIES } from "./types";
import type { Category, Item, Outfit } from "./types";

export interface Insights {
  totalItems: number;
  totalOutfits: number;
  totalWears: number;
  byCategory: { category: Category; count: number }[];
  mostWorn: Item[];
  neverWorn: Item[];
  favorites: number;
  topColors: { color: string; count: number }[];
  /** share of items worn at least once, 0..1 */
  utilisation: number;
}

export function computeInsights(items: Item[], outfits: Outfit[]): Insights {
  const byCategory = CATEGORIES.map((category) => ({
    category,
    count: items.filter((i) => i.category === category).length,
  }));

  const colorCounts = new Map<string, number>();
  for (const i of items) colorCounts.set(i.color, (colorCounts.get(i.color) ?? 0) + 1);

  const worn = items.filter((i) => i.wearCount > 0);
  return {
    totalItems: items.length,
    totalOutfits: outfits.length,
    totalWears: items.reduce((n, i) => n + i.wearCount, 0),
    byCategory,
    mostWorn: [...worn].sort((a, b) => b.wearCount - a.wearCount || a.name.localeCompare(b.name)).slice(0, 5),
    neverWorn: items.filter((i) => i.wearCount === 0).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    favorites: items.filter((i) => i.favorite).length,
    topColors: [...colorCounts.entries()]
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    utilisation: items.length ? worn.length / items.length : 0,
  };
}
