import { useMemo } from "react";
import { ItemThumb } from "../avatar/Avatar";
import { CATEGORY_LABELS } from "../lib/catalog";
import { computeInsights } from "../lib/insights";
import { useStore } from "../lib/store";

export default function Insights() {
  const { data } = useStore();
  const s = useMemo(() => computeInsights(data.items, data.outfits), [data.items, data.outfits]);
  const maxCat = Math.max(1, ...s.byCategory.map((c) => c.count));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Insights</span>
          <h1>Your style in numbers</h1>
          <p className="muted">Mark looks as worn on the Outfits page to fill these in.</p>
        </div>
      </header>

      <div className="stat-row">
        <div className="stat"><span>Items</span><strong>{s.totalItems}</strong></div>
        <div className="stat"><span>Saved looks</span><strong>{s.totalOutfits}</strong></div>
        <div className="stat"><span>Times worn</span><strong>{s.totalWears}</strong></div>
        <div className="stat"><span>Closet used</span><strong>{Math.round(s.utilisation * 100)}%</strong><small>of items worn at least once</small></div>
      </div>

      <div className="insight-grid">
        <section className="panel">
          <h2 className="mini-title">Items by category</h2>
          <ul className="bars">
            {s.byCategory.map((c) => (
              <li key={c.category}>
                <span className="bar-label">{CATEGORY_LABELS[c.category]}</span>
                <span className="bar-track"><span className="bar-fill" style={{ width: `${(c.count / maxCat) * 100}%` }} /></span>
                <span className="bar-value">{c.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2 className="mini-title">Your colour palette</h2>
          <div className="palette">
            {s.topColors.map((c) => (
              <div key={c.color} className="pal">
                <span style={{ background: c.color }} />
                <small>{c.count}</small>
              </div>
            ))}
          </div>
          <h2 className="mini-title mt">Most worn</h2>
          {s.mostWorn.length === 0 ? (
            <p className="muted small">Nothing worn yet. Use “Wore it” on a saved look.</p>
          ) : (
            <ol className="rank">
              {s.mostWorn.map((i) => (
                <li key={i.id}>
                  <span className="rank-thumb"><ItemThumb item={i} className="thumb" /></span>
                  <span>{i.name}</span>
                  <strong>{i.wearCount}×</strong>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="panel span-2">
          <h2 className="mini-title">Not worn yet <span className="muted">({s.neverWorn.length})</span></h2>
          <p className="muted small">Ideas for your next outfit, or pieces you might donate.</p>
          <div className="never">
            {s.neverWorn.slice(0, 12).map((i) => (
              <div key={i.id} className="never-item" title={i.name}>
                <ItemThumb item={i} className="thumb" />
                <span>{i.name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
