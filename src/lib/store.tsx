import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { DEFAULT_AVATAR, newId, starterItems } from "./catalog";
import { getPhoto, getValue, setValue, deletePhoto, clearAll } from "./db";
import { cleanLook, lookItems, todayKey, wearItem } from "./outfit";
import type { AppData, Avatar, Item, Look, Outfit, Slot, Weekday } from "./types";

const STORAGE_KEY = "app";

export function initialData(): AppData {
  const items = starterItems();
  const byName = (n: string) => items.find((i) => i.name === n)!.id;
  return {
    version: 1,
    avatar: DEFAULT_AVATAR,
    items,
    outfits: [
      { id: "outfit_1", name: "Weekend casual", look: { top: byName("Navy stripe tee"), bottom: byName("Blue jeans"), shoes: byName("White sneakers"), head: byName("Baseball cap") }, createdAt: new Date().toISOString(), wornDates: [] },
      { id: "outfit_2", name: "Office ready", look: { top: byName("Oxford shirt"), bottom: byName("Beige chinos"), outer: byName("Charcoal blazer"), shoes: byName("Black loafers"), wrist: byName("Silver watch") }, createdAt: new Date().toISOString(), wornDates: [] },
      { id: "outfit_3", name: "Autumn layers", look: { top: byName("Sage sweater"), bottom: byName("Blue jeans"), outer: byName("Camel coat"), shoes: byName("Chelsea boots"), neck: byName("Knit scarf") }, createdAt: new Date().toISOString(), wornDates: [] },
    ],
    plan: { 0: "outfit_2", 2: "outfit_2", 5: "outfit_1", 6: "outfit_3" },
    look: { top: byName("White tee"), bottom: byName("Blue jeans"), outer: byName("Denim jacket"), shoes: byName("White sneakers") },
    background: "studio",
  };
}

export type Action =
  | { type: "load"; data: AppData }
  | { type: "wear"; item: Item }
  | { type: "removeSlot"; slot: Slot }
  | { type: "setLook"; look: Look }
  | { type: "clearLook" }
  | { type: "addItem"; item: Item }
  | { type: "updateItem"; item: Item }
  | { type: "deleteItem"; id: string }
  | { type: "toggleFavorite"; id: string }
  | { type: "saveOutfit"; name: string }
  | { type: "renameOutfit"; id: string; name: string }
  | { type: "deleteOutfit"; id: string }
  | { type: "wearOutfitToday"; id: string; date: string }
  | { type: "plan"; day: Weekday; outfitId: string | null }
  | { type: "avatar"; avatar: Partial<Avatar> }
  | { type: "background"; background: AppData["background"] };

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case "load":
      return action.data;
    case "wear":
      return { ...state, look: wearItem(state.look, action.item) };
    case "removeSlot": {
      const look = { ...state.look };
      delete look[action.slot];
      return { ...state, look };
    }
    case "setLook":
      return { ...state, look: cleanLook(action.look, state.items) };
    case "clearLook":
      return { ...state, look: {} };
    case "addItem":
      return { ...state, items: [action.item, ...state.items] };
    case "updateItem":
      return { ...state, items: state.items.map((i) => (i.id === action.item.id ? action.item : i)) };
    case "deleteItem": {
      const items = state.items.filter((i) => i.id !== action.id);
      return {
        ...state,
        items,
        look: cleanLook(state.look, items),
        outfits: state.outfits.map((o) => ({ ...o, look: cleanLook(o.look, items) })),
      };
    }
    case "toggleFavorite":
      return { ...state, items: state.items.map((i) => (i.id === action.id ? { ...i, favorite: !i.favorite } : i)) };
    case "saveOutfit": {
      const outfit: Outfit = {
        id: newId("outfit"),
        name: action.name.trim() || `Look ${state.outfits.length + 1}`,
        look: { ...state.look },
        createdAt: new Date().toISOString(),
        wornDates: [],
      };
      return { ...state, outfits: [outfit, ...state.outfits] };
    }
    case "renameOutfit":
      return { ...state, outfits: state.outfits.map((o) => (o.id === action.id ? { ...o, name: action.name } : o)) };
    case "deleteOutfit": {
      const plan = { ...state.plan };
      for (const k of Object.keys(plan) as unknown as Weekday[]) if (plan[k] === action.id) delete plan[k];
      return { ...state, outfits: state.outfits.filter((o) => o.id !== action.id), plan };
    }
    case "wearOutfitToday": {
      const outfit = state.outfits.find((o) => o.id === action.id);
      if (!outfit || outfit.wornDates.includes(action.date)) return state;
      const ids = new Set(lookItems(outfit.look, state.items).map((i) => i.id));
      return {
        ...state,
        look: cleanLook(outfit.look, state.items),
        outfits: state.outfits.map((o) => (o.id === action.id ? { ...o, wornDates: [...o.wornDates, action.date] } : o)),
        items: state.items.map((i) => (ids.has(i.id) ? { ...i, wearCount: i.wearCount + 1, lastWorn: action.date } : i)),
      };
    }
    case "plan": {
      const plan = { ...state.plan };
      if (action.outfitId) plan[action.day] = action.outfitId;
      else delete plan[action.day];
      return { ...state, plan };
    }
    case "avatar":
      return { ...state, avatar: { ...state.avatar, ...action.avatar } };
    case "background":
      return { ...state, background: action.background };
  }
}

interface Store {
  data: AppData;
  ready: boolean;
  dispatch: (a: Action) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: () => Promise<void>;
  removeItem: (item: Item) => void;
  wearToday: (outfitId: string) => void;
}

const StoreContext = createContext<Store | null>(null);

/** Actions that change the look on the avatar are undoable. */
const UNDOABLE = new Set<Action["type"]>(["wear", "removeSlot", "setLook", "clearLook"]);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, baseDispatch] = useReducer(reducer, undefined, initialData);
  const [ready, setReady] = useState(false);
  const past = useRef<Look[]>([]);
  const future = useRef<Look[]>([]);
  const [, force] = useState(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    getValue<AppData>(STORAGE_KEY)
      .then((saved) => {
        if (saved && saved.version === 1 && Array.isArray(saved.items)) baseDispatch({ type: "load", data: { ...initialData(), ...saved } });
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  // Save (debounced) whenever data changes after loading
  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => setValue(STORAGE_KEY, data).catch(() => undefined), 250);
    return () => window.clearTimeout(id);
  }, [data, ready]);

  const dispatch = useCallback((a: Action) => {
    if (UNDOABLE.has(a.type)) {
      past.current = [...past.current.slice(-49), dataRef.current.look];
      future.current = [];
      force((n) => n + 1);
    }
    baseDispatch(a);
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(dataRef.current.look);
    baseDispatch({ type: "setLook", look: prev });
    force((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(dataRef.current.look);
    baseDispatch({ type: "setLook", look: next });
    force((n) => n + 1);
  }, []);

  const reset = useCallback(async () => {
    await clearAll();
    past.current = [];
    future.current = [];
    baseDispatch({ type: "load", data: initialData() });
  }, []);

  const removeItem = useCallback((item: Item) => {
    if (item.photoId) deletePhoto(item.photoId).catch(() => undefined);
    baseDispatch({ type: "deleteItem", id: item.id });
  }, []);

  const wearToday = useCallback((outfitId: string) => baseDispatch({ type: "wearOutfitToday", id: outfitId, date: todayKey() }), []);

  const value = useMemo<Store>(
    () => ({
      data,
      ready,
      dispatch,
      undo,
      redo,
      canUndo: past.current.length > 0,
      canRedo: future.current.length > 0,
      reset,
      removeItem,
      wearToday,
    }),
    [data, ready, dispatch, undo, redo, reset, removeItem, wearToday, past.current.length, future.current.length]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Object URL for a stored photo, cached and revoked when no longer used. */
const urlCache = new Map<string, { url: string; refs: number }>();

export function usePhotoUrl(photoId?: string): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => (photoId ? urlCache.get(photoId)?.url : undefined));
  useEffect(() => {
    if (!photoId) {
      setUrl(undefined);
      return;
    }
    let cancelled = false;
    const hit = urlCache.get(photoId);
    if (hit) {
      hit.refs++;
      setUrl(hit.url);
    } else {
      getPhoto(photoId).then((blob) => {
        if (cancelled || !blob) return;
        const entry = urlCache.get(photoId) ?? { url: URL.createObjectURL(blob), refs: 0 };
        entry.refs++;
        urlCache.set(photoId, entry);
        setUrl(entry.url);
      });
    }
    return () => {
      cancelled = true;
      const e = urlCache.get(photoId);
      if (e && --e.refs <= 0) {
        URL.revokeObjectURL(e.url);
        urlCache.delete(photoId);
      }
    };
  }, [photoId]);
  return url;
}
