import { describe, expect, it } from "vitest";
import { slotFor, starterItems } from "./catalog";
import { cleanLook, isWearing, lookItems, shuffleLook, weekdayIndex, wearItem } from "./outfit";
import type { Item } from "./types";

const items = starterItems(new Date("2026-01-01T00:00:00Z"));
const get = (name: string) => items.find((i) => i.name === name) as Item;

describe("slotFor", () => {
  it("maps categories and accessories to body slots", () => {
    expect(slotFor(get("White tee"))).toBe("top");
    expect(slotFor(get("Oxford shirt"))).toBe("top");
    expect(slotFor(get("Blue jeans"))).toBe("bottom");
    expect(slotFor(get("Plaid skirt"))).toBe("bottom");
    expect(slotFor(get("Polka dot dress"))).toBe("dress");
    expect(slotFor(get("Camel coat"))).toBe("outer");
    expect(slotFor(get("Baseball cap"))).toBe("head");
    expect(slotFor(get("Sunglasses"))).toBe("eyes");
    expect(slotFor(get("Knit scarf"))).toBe("neck");
    expect(slotFor(get("Canvas tote"))).toBe("bag");
    expect(slotFor(get("Silver watch"))).toBe("wrist");
  });
});

describe("wearItem", () => {
  it("puts an item into its slot", () => {
    expect(wearItem({}, get("White tee"))).toEqual({ top: get("White tee").id });
  });

  it("replaces the item already in that slot", () => {
    const look = wearItem(wearItem({}, get("White tee")), get("Oxford shirt"));
    expect(look.top).toBe(get("Oxford shirt").id);
  });

  it("takes an item off when it is clicked again", () => {
    const look = wearItem(wearItem({}, get("White tee")), get("White tee"));
    expect(look.top).toBeUndefined();
  });

  it("a dress replaces both top and bottom", () => {
    let look = wearItem({}, get("White tee"));
    look = wearItem(look, get("Blue jeans"));
    look = wearItem(look, get("Polka dot dress"));
    expect(look).toEqual({ dress: get("Polka dot dress").id });
  });

  it("a top or bottom removes the dress", () => {
    let look = wearItem({}, get("Polka dot dress"));
    look = wearItem(look, get("Blue jeans"));
    expect(look.dress).toBeUndefined();
    expect(look.bottom).toBe(get("Blue jeans").id);
  });

  it("does not mutate the previous look", () => {
    const before = { top: get("White tee").id };
    wearItem(before, get("Polka dot dress"));
    expect(before).toEqual({ top: get("White tee").id });
  });
});

describe("look helpers", () => {
  it("cleanLook removes ids that no longer exist", () => {
    const look = { top: get("White tee").id, bottom: "deleted_id" };
    expect(cleanLook(look, items)).toEqual({ top: get("White tee").id });
  });

  it("lookItems and isWearing", () => {
    const look = { top: get("White tee").id, shoes: get("White sneakers").id };
    expect(lookItems(look, items).map((i) => i.name).sort()).toEqual(["White sneakers", "White tee"]);
    expect(isWearing(look, get("White tee").id)).toBe(true);
    expect(isWearing(look, get("Blue jeans").id)).toBe(false);
  });
});

describe("shuffleLook", () => {
  it("always produces a complete, valid outfit", () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let n = 0; n < 200; n++) {
      const look = shuffleLook(items, rand);
      const hasDress = Boolean(look.dress);
      expect(hasDress ? !look.top && !look.bottom : Boolean(look.top && look.bottom)).toBe(true);
      expect(look.shoes).toBeDefined();
      for (const [slot, id] of Object.entries(look)) {
        expect(slotFor(items.find((i) => i.id === id)!)).toBe(slot);
      }
    }
  });

  it("works with an empty wardrobe", () => {
    expect(shuffleLook([])).toEqual({});
  });
});

describe("weekdayIndex", () => {
  it("is Monday-first", () => {
    expect(weekdayIndex(new Date(2026, 9, 19))).toBe(0); // Monday
    expect(weekdayIndex(new Date(2026, 9, 25))).toBe(6); // Sunday
  });
});
