import { useMemo, useRef, useState } from "react";
import { Avatar } from "../avatar/Avatar";
import { Icon, useToast } from "../components/ui";
import { exportBackup, importBackup } from "../lib/backup";
import { HAIR_COLORS, SKIN_TONES } from "../lib/catalog";
import { lookItems } from "../lib/outfit";
import { useStore } from "../lib/store";
import type { BodyShape, HairStyle } from "../lib/types";

const SHAPES: { id: BodyShape; label: string }[] = [
  { id: "slim", label: "Slim" },
  { id: "regular", label: "Regular" },
  { id: "curvy", label: "Curvy" },
  { id: "broad", label: "Broad" },
];
const HAIR: { id: HairStyle; label: string }[] = [
  { id: "short", label: "Short" },
  { id: "buzz", label: "Buzz" },
  { id: "curly", label: "Curly" },
  { id: "bob", label: "Bob" },
  { id: "long", label: "Long" },
  { id: "bun", label: "Bun" },
];

export default function AvatarPage() {
  const { data, dispatch, reset } = useStore();
  const toast = useToast();
  const a = data.avatar;
  const worn = useMemo(() => lookItems(data.look, data.items), [data.look, data.items]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof a>) => dispatch({ type: "avatar", avatar: patch });
  const heightCm = Math.round(170 * a.height);

  const onImport = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const restored = await importBackup(file);
      dispatch({ type: "load", data: restored });
      toast("Wardrobe restored from backup");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="page avatar-page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Avatar</span>
          <h1>Your digital body</h1>
          <p className="muted">Make the avatar look like you, so outfits are easier to picture.</p>
        </div>
      </header>

      <div className="avatar-layout">
        <div className={`stage bg-${data.background} avatar-stage`}>
          <Avatar avatar={a} worn={worn} className="stage-avatar" />
        </div>

        <div className="panel stack">
          <label className="field">
            <span>Name</span>
            <input value={a.name} onChange={(e) => set({ name: e.target.value.slice(0, 24) })} placeholder="Your name" />
          </label>

          <div className="field">
            <span>Body shape</span>
            <div className="segmented" role="radiogroup" aria-label="Body shape">
              {SHAPES.map((s) => (
                <button key={s.id} role="radio" aria-checked={a.body === s.id} className={a.body === s.id ? "on" : ""} onClick={() => set({ body: s.id })}>{s.label}</button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>Height <output>≈ {heightCm} cm</output></span>
            <input type="range" min="0.92" max="1.08" step="0.01" value={a.height} onChange={(e) => set({ height: Number(e.target.value) })} />
          </label>

          <div className="field">
            <span>Skin tone</span>
            <div className="color-picker" role="radiogroup" aria-label="Skin tone">
              {SKIN_TONES.map((c) => (
                <button key={c} role="radio" aria-checked={a.skin === c} className={`swatch lg ${a.skin === c ? "on" : ""}`} style={{ background: c }} onClick={() => set({ skin: c })} aria-label={`Skin tone ${c}`} />
              ))}
            </div>
          </div>

          <div className="field">
            <span>Hair style</span>
            <div className="segmented wrap" role="radiogroup" aria-label="Hair style">
              {HAIR.map((h) => (
                <button key={h.id} role="radio" aria-checked={a.hair === h.id} className={a.hair === h.id ? "on" : ""} onClick={() => set({ hair: h.id })}>{h.label}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Hair colour</span>
            <div className="color-picker" role="radiogroup" aria-label="Hair colour">
              {HAIR_COLORS.map((c) => (
                <button key={c} role="radio" aria-checked={a.hairColor === c} className={`swatch lg ${a.hairColor === c ? "on" : ""}`} style={{ background: c }} onClick={() => set({ hairColor: c })} aria-label={`Hair colour ${c}`} />
              ))}
            </div>
          </div>

          <div className="data-box">
            <h2 className="mini-title">Your data</h2>
            <p className="muted small">Everything is stored privately in this browser. Back it up to move it to another device.</p>
            <div className="data-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => exportBackup(data).then(() => toast("Backup downloaded"))}>
                <Icon name="download" size={15} /> Export backup
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>
                <Icon name="upload" size={15} /> {busy ? "Importing…" : "Import backup"}
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (window.confirm("Reset everything? Your items, photos and outfits will be deleted.")) reset().then(() => toast("Wardrobe reset"));
                }}
              >
                <Icon name="trash" size={15} /> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
