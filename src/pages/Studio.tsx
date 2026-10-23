import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Avatar } from "../avatar/Avatar";
import { ItemCard } from "../components/ItemCard";
import { ItemEditor } from "../components/ItemEditor";
import { EmptyState, Icon, Modal, useToast } from "../components/ui";
import { CATEGORY_LABELS, slotFor } from "../lib/catalog";
import { isWearing, lookItems, shuffleLook } from "../lib/outfit";
import { useStore } from "../lib/store";
import { CATEGORIES, type AppData, type Category, type Item, type Slot } from "../lib/types";

const SLOT_LABELS: Record<Slot, string> = {
  head: "Head",
  eyes: "Eyes",
  neck: "Neck",
  outer: "Outerwear",
  top: "Top",
  dress: "Dress",
  bottom: "Bottom",
  shoes: "Shoes",
  bag: "Bag",
  wrist: "Wrist",
};
const SLOT_ORDER: Slot[] = ["head", "eyes", "neck", "outer", "top", "dress", "bottom", "shoes", "bag", "wrist"];

const BACKGROUNDS: { id: AppData["background"]; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "warm", label: "Sunset" },
  { id: "city", label: "City" },
  { id: "night", label: "Night" },
];

export default function Studio() {
  const { data, dispatch, undo, redo, canUndo, canRedo } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<Category | "all" | "favorites">("all");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const worn = useMemo(() => lookItems(data.look, data.items), [data.look, data.items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.items.filter((i) => {
      if (tab === "favorites" ? !i.favorite : tab !== "all" && i.category !== tab) return false;
      return !q || i.name.toLowerCase().includes(q) || (i.brand ?? "").toLowerCase().includes(q);
    });
  }, [data.items, tab, query]);

  const counts = useMemo(() => {
    const m = new Map<Category, number>();
    for (const i of data.items) m.set(i.category, (m.get(i.category) ?? 0) + 1);
    return m;
  }, [data.items]);

  const wear = useCallback((item: Item) => dispatch({ type: "wear", item }), [dispatch]);
  const favorite = useCallback((item: Item) => dispatch({ type: "toggleFavorite", id: item.id }), [dispatch]);

  // Keyboard shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [role=dialog]")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const shuffle = () => {
    if (!data.items.length) return;
    dispatch({ type: "setLook", look: shuffleLook(data.items) });
  };

  return (
    <div className="studio">
      <section className="stage-wrap" aria-label="Your avatar">
        <div className={`stage bg-${data.background}`}>
          <div className="stage-top">
            <div>
              <span className="eyebrow">Try-on studio</span>
              <h1 className="stage-title">{data.avatar.name.trim() ? `${data.avatar.name.trim()}’s look` : "Your look"}</h1>
            </div>
            <div className="bg-picker" role="radiogroup" aria-label="Background">
              {BACKGROUNDS.map((b) => (
                <button key={b.id} role="radio" aria-checked={data.background === b.id} className={`bg-dot bg-${b.id} ${data.background === b.id ? "on" : ""}`} onClick={() => dispatch({ type: "background", background: b.id })} title={b.label} aria-label={`${b.label} background`} />
              ))}
            </div>
          </div>
          <Avatar avatar={data.avatar} worn={worn} className="stage-avatar" />
          <div className="toolbar" role="toolbar" aria-label="Look actions">
            <button className="tool tool-icon" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
              <Icon name="undo" />
            </button>
            <button className="tool tool-icon" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
              <Icon name="redo" />
            </button>
            <button className="tool" onClick={shuffle} title="Random outfit">
              <Icon name="shuffle" /> <span>Shuffle</span>
            </button>
            <button className="tool" onClick={() => dispatch({ type: "clearLook" })} disabled={!worn.length} title="Take everything off">
              <Icon name="eraser" /> <span>Clear</span>
            </button>
            <button className="tool tool-primary" onClick={() => setSaving(true)} disabled={!worn.length}>
              <Icon name="save" /> <span>Save look</span>
            </button>
          </div>
        </div>

        <div className="wearing">
          <h2 className="mini-title">Wearing now</h2>
          {worn.length === 0 ? (
            <p className="muted small">Nothing yet. Pick items from the wardrobe.</p>
          ) : (
            <ul className="wearing-list">
              {SLOT_ORDER.filter((s) => data.look[s]).map((slot) => {
                const item = worn.find((i) => i.id === data.look[slot]);
                if (!item) return null;
                return (
                  <li key={slot}>
                    <span className="dot" style={{ background: item.color }} />
                    <span className="wl-slot">{SLOT_LABELS[slot]}</span>
                    <span className="wl-name">{item.name}</span>
                    <button className="icon-btn sm" onClick={() => dispatch({ type: "removeSlot", slot })} aria-label={`Take off ${item.name}`}>
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="closet" aria-label="Wardrobe">
        <div className="closet-head">
          <div>
            <span className="eyebrow">Wardrobe</span>
            <h2 className="closet-title">Pick something to wear</h2>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} /> Add item
          </button>
        </div>

        <div className="tabs" role="tablist" aria-label="Categories">
          <button role="tab" aria-selected={tab === "all"} className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>
            All <span>{data.items.length}</span>
          </button>
          <button role="tab" aria-selected={tab === "favorites"} className={tab === "favorites" ? "on" : ""} onClick={() => setTab("favorites")}>
            <Icon name="heart" size={13} filled={tab === "favorites"} /> Favourites
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} role="tab" aria-selected={tab === c} className={tab === c ? "on" : ""} onClick={() => setTab(c)}>
              {CATEGORY_LABELS[c]} <span>{counts.get(c) ?? 0}</span>
            </button>
          ))}
        </div>

        <label className="search">
          <Icon name="search" size={16} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or brand" aria-label="Search wardrobe" />
        </label>

        {visible.length === 0 ? (
          <EmptyState
            title={tab === "favorites" ? "No favourites yet" : "Nothing here yet"}
            text={tab === "favorites" ? "Tap the heart on any item to keep it handy." : "Add your first piece to this section."}
            action={tab !== "favorites" && <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>Add item</button>}
          />
        ) : (
          <div className="closet-grid">
            {visible.map((item) => (
              <ItemCard key={item.id} item={item} compact active={isWearing(data.look, item.id)} onClick={wear} onFavorite={favorite} />
            ))}
          </div>
        )}
        <p className="muted small closet-tip">
          Tip: wearing a dress replaces the top and bottom. Only one item per slot is worn at a time.
        </p>
      </section>

      {saving && <SaveLookModal onClose={() => setSaving(false)} onSave={(name) => { dispatch({ type: "saveOutfit", name }); toast(`Saved look “${name || "Untitled"}”`); setSaving(false); }} suggested={suggestName(worn)} />}
      {adding && <ItemEditor defaultCategory={tab !== "all" && tab !== "favorites" ? tab : "tops"} onClose={() => setAdding(false)} />}
    </div>
  );
}

function suggestName(worn: Item[]): string {
  const outer = worn.find((i) => slotFor(i) === "outer" || slotFor(i) === "dress" || slotFor(i) === "top");
  return outer ? `${outer.name} look` : "My look";
}

function SaveLookModal({ onClose, onSave, suggested }: { onClose: () => void; onSave: (name: string) => void; suggested: string }) {
  const [name, setName] = useState(suggested);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave(name.trim().slice(0, 40));
  };
  return (
    <Modal title="Save this look" onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </label>
        <div className="editor-actions">
          <span className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save look</button>
        </div>
      </form>
    </Modal>
  );
}
