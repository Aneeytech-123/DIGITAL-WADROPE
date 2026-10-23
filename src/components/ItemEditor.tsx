import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Avatar } from "../avatar/Avatar";
import { CATEGORY_LABELS, OCCASIONS, PATTERNS, SEASONS, TEMPLATES, newId } from "../lib/catalog";
import { putPhoto } from "../lib/db";
import { processPhoto } from "../lib/image";
import { cleanLook, lookItems, wearItem } from "../lib/outfit";
import { useStore } from "../lib/store";
import { CATEGORIES, type Category, type Item } from "../lib/types";
import { ChipSelect, ColorPicker, Icon, Modal, useToast } from "./ui";

interface Props {
  item?: Item;
  defaultCategory?: Category;
  onClose: () => void;
}

function blank(category: Category): Item {
  return {
    id: newId("item"),
    name: "",
    category,
    kind: "design",
    template: TEMPLATES[category][0].id,
    color: "#2f4a6d",
    color2: "#f7f4ee",
    pattern: "solid",
    seasons: [],
    occasions: [],
    favorite: false,
    wearCount: 0,
    createdAt: new Date().toISOString(),
  };
}

export function ItemEditor({ item, defaultCategory = "tops", onClose }: Props) {
  const { data, dispatch, removeItem } = useStore();
  const toast = useToast();
  const editing = Boolean(item);
  const [draft, setDraft] = useState<Item>(() => item ?? blank(defaultCategory));
  const [removeBg, setRemoveBg] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);

  const set = (patch: Partial<Item>) => setDraft((d) => ({ ...d, ...patch }));

  // Keep the template valid for the chosen category
  useEffect(() => {
    if (!TEMPLATES[draft.category].some((t) => t.id === draft.template)) {
      set({ template: TEMPLATES[draft.category][0].id });
    }
  }, [draft.category, draft.template]);

  // Preview: current look with this item swapped in
  const preview = useMemo(() => {
    const others = data.items.filter((i) => i.id !== draft.id);
    const all = [draft, ...others];
    const look = wearItem(cleanLook(data.look, others), draft);
    return lookItems(look, all);
  }, [data.items, data.look, draft]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const { blob, color } = await processPhoto(file, removeBg);
      const photoId = newId("photo");
      await putPhoto(photoId, blob);
      set({
        kind: "photo",
        photoId,
        photoFit: { scale: 1, x: 0, y: 0 },
        color,
        name: draft.name || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 40),
      });
      setPhotoChanged(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't use that photo.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) {
      setError("Give the item a name.");
      return;
    }
    if (draft.kind === "photo" && !draft.photoId) {
      setError("Upload a photo, or switch to Design.");
      return;
    }
    const final = { ...draft, name: name.slice(0, 40) };
    dispatch(editing ? { type: "updateItem", item: final } : { type: "addItem", item: final });
    toast(editing ? `Saved “${final.name}”` : `Added “${final.name}” to your wardrobe`);
    onClose();
  };

  const onDelete = () => {
    if (!item) return;
    if (!window.confirm(`Delete “${item.name}”? It will be removed from saved outfits too.`)) return;
    removeItem(item);
    toast(`Deleted “${item.name}”`);
    onClose();
  };

  const fit = draft.photoFit ?? { scale: 1, x: 0, y: 0 };

  return (
    <Modal title={editing ? "Edit item" : "Add to wardrobe"} onClose={onClose} wide>
      <form className="editor" onSubmit={submit}>
        <div className="editor-preview">
          <Avatar avatar={data.avatar} worn={preview} className="editor-avatar" title="Preview on your avatar" />
          <p className="hint">Live preview on your avatar</p>
        </div>

        <div className="editor-fields">
          <div className="segmented" role="tablist" aria-label="Item type">
            <button type="button" role="tab" aria-selected={draft.kind === "design"} className={draft.kind === "design" ? "on" : ""} onClick={() => set({ kind: "design" })}>
              <Icon name="sparkle" size={16} /> Design
            </button>
            <button type="button" role="tab" aria-selected={draft.kind === "photo"} className={draft.kind === "photo" ? "on" : ""} onClick={() => set({ kind: "photo" })}>
              <Icon name="upload" size={16} /> Upload photo
            </button>
          </div>

          {error && <div className="alert" role="alert">{error}</div>}

          <label className="field">
            <span>Name</span>
            <input value={draft.name} onChange={(e) => set({ name: e.target.value })} maxLength={40} placeholder="e.g. Linen shirt" required />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Category</span>
              <select value={draft.category} onChange={(e) => set({ category: e.target.value as Category })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{draft.kind === "photo" ? "Wear it as" : "Style"}</span>
              <select value={draft.template} onChange={(e) => set({ template: e.target.value as Item["template"] })}>
                {TEMPLATES[draft.category].map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
          </div>

          {draft.kind === "design" ? (
            <>
              <div className="field">
                <span>Main colour</span>
                <ColorPicker value={draft.color} onChange={(color) => set({ color })} label="Main colour" />
              </div>
              <div className="field-row">
                <label className="field">
                  <span>Pattern</span>
                  <select value={draft.pattern} onChange={(e) => set({ pattern: e.target.value as Item["pattern"] })}>
                    {PATTERNS.map((pt) => (
                      <option key={pt.id} value={pt.id}>{pt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Detail colour</span>
                  <span className="inline-color">
                    <input type="color" value={draft.color2} onChange={(e) => set({ color2: e.target.value })} aria-label="Detail colour" />
                    <code>{draft.color2}</code>
                  </span>
                </label>
              </div>
            </>
          ) : (
            <div className="upload-box">
              <label className={`dropzone ${busy ? "busy" : ""}`}>
                <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} disabled={busy} />
                <Icon name="upload" size={22} />
                <strong>{busy ? "Processing photo…" : draft.photoId ? "Choose a different photo" : "Choose a photo of the item"}</strong>
                <small>Tip: lay it flat on a plain background. PNG/JPG up to 15 MB.</small>
              </label>
              <label className="check">
                <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} />
                Remove plain background automatically
              </label>
              {draft.photoId && (
                <div className="fit">
                  <label>
                    <span>Size</span>
                    <input type="range" min="0.5" max="1.6" step="0.02" value={fit.scale} onChange={(e) => set({ photoFit: { ...fit, scale: Number(e.target.value) } })} />
                  </label>
                  <label>
                    <span>Left / right</span>
                    <input type="range" min="-60" max="60" step="1" value={fit.x} onChange={(e) => set({ photoFit: { ...fit, x: Number(e.target.value) } })} />
                  </label>
                  <label>
                    <span>Up / down</span>
                    <input type="range" min="-80" max="80" step="1" value={fit.y} onChange={(e) => set({ photoFit: { ...fit, y: Number(e.target.value) } })} />
                  </label>
                  {photoChanged && <p className="hint">Photo saved on this device. Adjust the fit using the preview.</p>}
                </div>
              )}
            </div>
          )}

          <label className="field">
            <span>Brand (optional)</span>
            <input value={draft.brand ?? ""} onChange={(e) => set({ brand: e.target.value.slice(0, 40) })} placeholder="e.g. Uniqlo" />
          </label>

          <div className="field">
            <span>Seasons</span>
            <ChipSelect options={SEASONS} value={draft.seasons} onChange={(seasons) => set({ seasons })} label="Seasons" />
          </div>
          <div className="field">
            <span>Occasions</span>
            <ChipSelect options={OCCASIONS} value={draft.occasions} onChange={(occasions) => set({ occasions })} label="Occasions" />
          </div>

          <div className="editor-actions">
            {editing && (
              <button type="button" className="btn btn-danger" onClick={onDelete}>
                <Icon name="trash" size={16} /> Delete
              </button>
            )}
            <span className="spacer" />
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{editing ? "Save changes" : "Add item"}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
