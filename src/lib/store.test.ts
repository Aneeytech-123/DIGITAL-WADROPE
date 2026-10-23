import { describe, expect, it } from "vitest";
import { computeInsights } from "./insights";
import { initialData, reducer } from "./store";

describe("reducer", () => {
  it("saving an outfit stores the current look", () => {
    const s0 = initialData();
    const s1 = reducer(s0, { type: "saveOutfit", name: "Test look" });
    expect(s1.outfits[0].name).toBe("Test look");
    expect(s1.outfits[0].look).toEqual(s0.look);
    expect(s1.outfits).toHaveLength(s0.outfits.length + 1);
  });

  it("deleting an item removes it from the look and saved outfits", () => {
    const s0 = initialData();
    const jeansId = s0.look.bottom!;
    const s1 = reducer(s0, { type: "deleteItem", id: jeansId });
    expect(s1.items.some((i) => i.id === jeansId)).toBe(false);
    expect(s1.look.bottom).toBeUndefined();
    expect(s1.outfits.every((o) => !Object.values(o.look).includes(jeansId))).toBe(true);
  });

  it("wearing an outfit today counts each item once per day", () => {
    const s0 = initialData();
    const id = s0.outfits[0].id;
    const s1 = reducer(s0, { type: "wearOutfitToday", id, date: "2026-10-23" });
    const s2 = reducer(s1, { type: "wearOutfitToday", id, date: "2026-10-23" });
    const worn = s2.items.filter((i) => i.wearCount > 0);
    expect(worn.length).toBe(Object.keys(s0.outfits[0].look).length);
    expect(worn.every((i) => i.wearCount === 1 && i.lastWorn === "2026-10-23")).toBe(true);
    expect(s2.outfits[0].wornDates).toEqual(["2026-10-23"]);
    expect(s2.look).toEqual(s0.outfits[0].look);
  });

  it("deleting an outfit clears it from the week plan", () => {
    const s0 = initialData();
    const planned = s0.plan[0]!;
    const s1 = reducer(s0, { type: "deleteOutfit", id: planned });
    expect(Object.values(s1.plan)).not.toContain(planned);
  });

  it("toggles favourites and updates the avatar", () => {
    const s0 = initialData();
    const id = s0.items[0].id;
    const s1 = reducer(s0, { type: "toggleFavorite", id });
    expect(s1.items[0].favorite).toBe(true);
    const s2 = reducer(s1, { type: "avatar", avatar: { body: "curvy", height: 1.05 } });
    expect(s2.avatar.body).toBe("curvy");
    expect(s2.avatar.height).toBe(1.05);
    expect(s2.avatar.skin).toBe(s0.avatar.skin);
  });
});

describe("computeInsights", () => {
  it("summarises the wardrobe", () => {
    const s0 = initialData();
    const s1 = reducer(s0, { type: "wearOutfitToday", id: s0.outfits[1].id, date: "2026-10-20" });
    const s2 = reducer(s1, { type: "wearOutfitToday", id: s0.outfits[1].id, date: "2026-10-21" });
    const ins = computeInsights(s2.items, s2.outfits);
    expect(ins.totalItems).toBe(s2.items.length);
    expect(ins.byCategory.reduce((n, c) => n + c.count, 0)).toBe(s2.items.length);
    expect(ins.mostWorn[0].wearCount).toBe(2);
    expect(ins.neverWorn.length).toBe(s2.items.length - Object.keys(s0.outfits[1].look).length);
    expect(ins.utilisation).toBeCloseTo(Object.keys(s0.outfits[1].look).length / s2.items.length);
  });
});
