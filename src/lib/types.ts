export const CATEGORIES = [
  "tops",
  "shirts",
  "outerwear",
  "pants",
  "shorts",
  "skirts",
  "dresses",
  "shoes",
  "accessories",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Where a garment sits on the body. One item per slot can be worn at a time. */
export type Slot = "top" | "bottom" | "dress" | "outer" | "shoes" | "head" | "eyes" | "neck" | "bag" | "wrist";

export type Template =
  // tops
  | "tee" | "tank" | "longsleeve" | "sweater" | "hoodie"
  // shirts
  | "shirt" | "polo"
  // outerwear
  | "jacket" | "blazer" | "coat"
  // bottoms
  | "jeans" | "trousers" | "joggers" | "shorts" | "skirt" | "midiskirt"
  // dresses
  | "dress" | "maxidress"
  // shoes
  | "sneakers" | "boots" | "loafers" | "heels"
  // accessories
  | "cap" | "beanie" | "sunglasses" | "scarf" | "tote" | "watch";

export type Pattern = "solid" | "stripes" | "checks" | "dots" | "denim" | "knit";

export type Season = "spring" | "summer" | "autumn" | "winter";
export type Occasion = "casual" | "work" | "party" | "sport" | "formal";

export interface PhotoFit {
  /** 1 = fill the slot box */
  scale: number;
  /** offsets in avatar units */
  x: number;
  y: number;
}

export interface Item {
  id: string;
  name: string;
  category: Category;
  /** "design": drawn from a template. "photo": the user's own picture. */
  kind: "design" | "photo";
  template: Template;
  color: string;
  color2: string;
  pattern: Pattern;
  photoId?: string;
  photoFit?: PhotoFit;
  brand?: string;
  seasons: Season[];
  occasions: Occasion[];
  favorite: boolean;
  wearCount: number;
  lastWorn?: string;
  createdAt: string;
}

/** Item ids currently worn, by slot. */
export type Look = Partial<Record<Slot, string>>;

export interface Outfit {
  id: string;
  name: string;
  look: Look;
  createdAt: string;
  wornDates: string[];
}

export type SkinTone = string;
export type BodyShape = "slim" | "regular" | "curvy" | "broad";
export type HairStyle = "short" | "buzz" | "long" | "bun" | "curly" | "bob";

export interface Avatar {
  name: string;
  skin: SkinTone;
  body: BodyShape;
  /** 0.92 to 1.08 */
  height: number;
  hair: HairStyle;
  hairColor: string;
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface AppData {
  version: 1;
  avatar: Avatar;
  items: Item[];
  outfits: Outfit[];
  /** outfit id planned for each weekday (0 = Monday) */
  plan: Partial<Record<Weekday, string>>;
  look: Look;
  background: "studio" | "warm" | "city" | "night";
}
