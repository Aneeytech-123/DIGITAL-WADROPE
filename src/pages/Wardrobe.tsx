import { useCallback, useMemo, useState } from "react";
import { ItemCard } from "../components/ItemCard";
import { ItemEditor } from "../components/ItemEditor";
import { EmptyState, Icon } from "../components/ui";
import { CATEGORY_LABELS, OCCASIONS, SEASONS } from "../lib/catalog";
import { useStore } from "../lib/store";
import { CATEGORIES, type Category, type Item, type Occasion, type Season } from "../lib/types";

type Sort = "newest" | "name" | "most-worn" | "least-worn";

export default function Wardrobe() {
  const { data, dispatch } = useStore();
  const [category, setCategory] = useState<Category | "all">("all");
  const [season, setSeason] = useState<Season | "">("");
  const [occasion, setOccasion] = useState<Occasion | "">("");
  const [favOnly, setFavOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [editing, setEditing] = useState<Item | null>(null);
  const [adding, setAdding] = useState(false);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data.items.filter(
      (i) =>
        (category === "all" || i.category === category) &&
        (!season || i.seasons.includes(season)) &&
        (!occasion || i.occasions.includes(occasion)) &&
        (!favOnly || i.favorite) &&
        (!q || i.name.toLowerCase().includes(q) || (i.brand ?? "").toLowerCase().includes(q))
    );
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "most-worn") sorted.sort((a, b) => b.wearCount - a.wearCount || a.name.localeCompare(b.name));
    else if (sort === "least-worn") sorted.sort((a, b) => a.wearCount - b.wearCount || a.name.localeCompare(b.name));
    else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }, [data.items, category, season, occasion, favOnly, query, sort]);

  const favorite = useCallback((item: Item) => dispatch({ type: "toggleFavorite", id: item.id }), [dispatch]);
  const filtered = category !== "all" || season || occasion || favOnly || query;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Wardrobe</span>
          <h1>Your closet</h1>
          <p className="muted">{data.items.length} items · {data.items.filter((i) => i.kind === "photo").length} from your photos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} /> Add item
        </button>
      </header>

      <div className="filters">
        <label className="search grow">
          <Icon name="search" size={16} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or brand" aria-label="Search" />
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value as Category | "all")} aria-label="Category">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <select value={season} onChange={(e) => setSeason(e.target.value as Season | "")} aria-label="Season">
          <option value="">Any season</option>
          {SEASONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={occasion} onChange={(e) => setOccasion(e.target.value as Occasion | "")} aria-label="Occasion">
          <option value="">Any occasion</option>
          {OCCASIONS.map((o) => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="most-worn">Most worn</option>
          <option value="least-worn">Least worn</option>
        </select>
        <button className={`chip ${favOnly ? "on" : ""}`} aria-pressed={favOnly} onClick={() => setFavOnly((v) => !v)}>
          <Icon name="heart" size={14} filled={favOnly} /> Favourites
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={filtered ? "No items match" : "Your wardrobe is empty"}
          text={filtered ? "Try clearing a filter." : "Add clothes by designing them or uploading a photo."}
          action={<button className="btn btn-primary" onClick={() => setAdding(true)}>Add item</button>}
        />
      ) : (
        <div className="wardrobe-grid">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onClick={setEditing} onFavorite={favorite} />
          ))}
        </div>
      )}

      {editing && <ItemEditor item={editing} onClose={() => setEditing(null)} />}
      {adding && <ItemEditor defaultCategory={category === "all" ? "tops" : category} onClose={() => setAdding(false)} />}
    </div>
  );
}
