import type { Avatar, Category, Item, Occasion, Pattern, Season, Slot, Template } from "./types";

export const CATEGORY_LABELS: Record<Category, string> = {
  tops: "Tops",
  shirts: "Shirts",
  outerwear: "Outerwear",
  pants: "Pants",
  shorts: "Shorts",
  skirts: "Skirts",
  dresses: "Dresses",
  shoes: "Shoes",
  accessories: "Accessories",
};

/** Templates available for each category, with a friendly label. */
export const TEMPLATES: Record<Category, { id: Template; label: string }[]> = {
  tops: [
    { id: "tee", label: "T-shirt" },
    { id: "tank", label: "Tank top" },
    { id: "longsleeve", label: "Long sleeve" },
    { id: "sweater", label: "Sweater" },
    { id: "hoodie", label: "Hoodie" },
  ],
  shirts: [
    { id: "shirt", label: "Button-up shirt" },
    { id: "polo", label: "Polo" },
  ],
  outerwear: [
    { id: "jacket", label: "Jacket" },
    { id: "blazer", label: "Blazer" },
    { id: "coat", label: "Long coat" },
  ],
  pants: [
    { id: "jeans", label: "Jeans" },
    { id: "trousers", label: "Trousers" },
    { id: "joggers", label: "Joggers" },
  ],
  shorts: [{ id: "shorts", label: "Shorts" }],
  skirts: [
    { id: "skirt", label: "Mini skirt" },
    { id: "midiskirt", label: "Midi skirt" },
  ],
  dresses: [
    { id: "dress", label: "Dress" },
    { id: "maxidress", label: "Maxi dress" },
  ],
  shoes: [
    { id: "sneakers", label: "Sneakers" },
    { id: "boots", label: "Boots" },
    { id: "loafers", label: "Loafers" },
    { id: "heels", label: "Heels" },
  ],
  accessories: [
    { id: "cap", label: "Cap" },
    { id: "beanie", label: "Beanie" },
    { id: "sunglasses", label: "Sunglasses" },
    { id: "scarf", label: "Scarf" },
    { id: "tote", label: "Tote bag" },
    { id: "watch", label: "Watch" },
  ],
};

const ACCESSORY_SLOT: Partial<Record<Template, Slot>> = {
  cap: "head",
  beanie: "head",
  sunglasses: "eyes",
  scarf: "neck",
  tote: "bag",
  watch: "wrist",
};

/** Which body slot an item occupies. */
export function slotFor(item: Pick<Item, "category" | "template">): Slot {
  switch (item.category) {
    case "tops":
    case "shirts":
      return "top";
    case "outerwear":
      return "outer";
    case "pants":
    case "shorts":
    case "skirts":
      return "bottom";
    case "dresses":
      return "dress";
    case "shoes":
      return "shoes";
    case "accessories":
      return ACCESSORY_SLOT[item.template] ?? "bag";
  }
}

export const PATTERNS: { id: Pattern; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "stripes", label: "Stripes" },
  { id: "checks", label: "Checks" },
  { id: "dots", label: "Dots" },
  { id: "denim", label: "Denim" },
  { id: "knit", label: "Knit" },
];

export const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];
export const OCCASIONS: Occasion[] = ["casual", "work", "party", "sport", "formal"];

export const PALETTE = [
  "#f7f4ee", "#d9d4cb", "#8a8580", "#2b2b2e", "#111114",
  "#c9a27e", "#8b5e3c", "#5b3a29", "#e8c9a0", "#d4b483",
  "#2f4a6d", "#4f7cac", "#9cc3e0", "#1f3b2c", "#4f7a5a",
  "#a8c3a0", "#7a1f2b", "#c0392b", "#e07a5f", "#f2cc8f",
  "#e9a6b3", "#8e6c8a", "#3d348b", "#f4d35e",
];

export const SKIN_TONES = ["#f8dcc4", "#eec1a0", "#d9a07b", "#c08258", "#9b6440", "#6f4428", "#4a2c1a"];
export const HAIR_COLORS = ["#1c1714", "#3b2a20", "#6b4428", "#a9713f", "#d8b26e", "#e9e2d2", "#8a3b2b"];

export const DEFAULT_AVATAR: Avatar = {
  name: "",
  skin: "#c08258",
  body: "regular",
  height: 1,
  hair: "short",
  hairColor: "#1c1714",
};

let counter = 0;
export function newId(prefix = "id"): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

type Seed = [name: string, category: Category, template: Template, color: string, pattern: Pattern, color2: string, seasons: Season[], occasions: Occasion[]];

const SEED: Seed[] = [
  ["White tee", "tops", "tee", "#f7f4ee", "solid", "#d9d4cb", ["spring", "summer"], ["casual"]],
  ["Navy stripe tee", "tops", "tee", "#f7f4ee", "stripes", "#2f4a6d", ["spring", "summer"], ["casual"]],
  ["Black tank", "tops", "tank", "#2b2b2e", "solid", "#111114", ["summer"], ["sport", "casual"]],
  ["Sage sweater", "tops", "sweater", "#a8c3a0", "knit", "#4f7a5a", ["autumn", "winter"], ["casual", "work"]],
  ["Grey hoodie", "tops", "hoodie", "#8a8580", "solid", "#d9d4cb", ["autumn", "winter"], ["casual", "sport"]],
  ["Oxford shirt", "shirts", "shirt", "#9cc3e0", "solid", "#f7f4ee", ["spring", "autumn"], ["work", "formal"]],
  ["Flannel shirt", "shirts", "shirt", "#7a1f2b", "checks", "#2b2b2e", ["autumn", "winter"], ["casual"]],
  ["Cream polo", "shirts", "polo", "#e8c9a0", "solid", "#f7f4ee", ["summer"], ["casual", "work"]],
  ["Denim jacket", "outerwear", "jacket", "#4f7cac", "denim", "#2f4a6d", ["spring", "autumn"], ["casual"]],
  ["Camel coat", "outerwear", "coat", "#c9a27e", "solid", "#8b5e3c", ["autumn", "winter"], ["work", "formal"]],
  ["Charcoal blazer", "outerwear", "blazer", "#2b2b2e", "solid", "#111114", ["spring", "autumn", "winter"], ["work", "formal", "party"]],
  ["Blue jeans", "pants", "jeans", "#2f4a6d", "denim", "#4f7cac", ["spring", "autumn", "winter"], ["casual"]],
  ["Beige chinos", "pants", "trousers", "#d4b483", "solid", "#c9a27e", ["spring", "summer", "autumn"], ["work", "casual"]],
  ["Black joggers", "pants", "joggers", "#111114", "solid", "#2b2b2e", ["autumn", "winter"], ["sport", "casual"]],
  ["Khaki shorts", "shorts", "shorts", "#c9a27e", "solid", "#8b5e3c", ["summer"], ["casual"]],
  ["Plaid skirt", "skirts", "skirt", "#7a1f2b", "checks", "#2b2b2e", ["autumn"], ["casual", "party"]],
  ["Olive midi skirt", "skirts", "midiskirt", "#4f7a5a", "solid", "#1f3b2c", ["spring", "autumn"], ["work"]],
  ["Polka dot dress", "dresses", "dress", "#3d348b", "dots", "#f7f4ee", ["spring", "summer"], ["party", "casual"]],
  ["Terracotta maxi", "dresses", "maxidress", "#e07a5f", "solid", "#c0392b", ["summer"], ["party"]],
  ["White sneakers", "shoes", "sneakers", "#f7f4ee", "solid", "#d9d4cb", ["spring", "summer", "autumn"], ["casual", "sport"]],
  ["Chelsea boots", "shoes", "boots", "#5b3a29", "solid", "#2b2b2e", ["autumn", "winter"], ["casual", "work"]],
  ["Black loafers", "shoes", "loafers", "#111114", "solid", "#2b2b2e", ["spring", "autumn"], ["work", "formal"]],
  ["Red heels", "shoes", "heels", "#c0392b", "solid", "#7a1f2b", ["spring", "summer"], ["party", "formal"]],
  ["Baseball cap", "accessories", "cap", "#2f4a6d", "solid", "#f7f4ee", ["spring", "summer"], ["casual", "sport"]],
  ["Wool beanie", "accessories", "beanie", "#e07a5f", "knit", "#c0392b", ["winter"], ["casual"]],
  ["Sunglasses", "accessories", "sunglasses", "#111114", "solid", "#5b3a29", ["summer"], ["casual"]],
  ["Knit scarf", "accessories", "scarf", "#f2cc8f", "knit", "#e07a5f", ["autumn", "winter"], ["casual"]],
  ["Canvas tote", "accessories", "tote", "#e8c9a0", "solid", "#8b5e3c", ["spring", "summer"], ["casual", "work"]],
  ["Silver watch", "accessories", "watch", "#d9d4cb", "solid", "#8a8580", ["spring", "summer", "autumn", "winter"], ["work", "formal"]],
];

/** Starter wardrobe so the app is useful from the first visit. */
export function starterItems(now = new Date()): Item[] {
  return SEED.map(([name, category, template, color, pattern, color2, seasons, occasions], i) => ({
    id: `seed_${i + 1}`,
    name,
    category,
    kind: "design",
    template,
    color,
    color2,
    pattern,
    seasons,
    occasions,
    favorite: false,
    wearCount: 0,
    createdAt: new Date(now.getTime() - (SEED.length - i) * 60000).toISOString(),
  }));
}
