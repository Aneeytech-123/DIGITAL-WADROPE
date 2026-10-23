import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../avatar/Avatar";
import { EmptyState, Icon, useToast } from "../components/ui";
import { lookItems, todayKey, weekdayIndex } from "../lib/outfit";
import { useStore } from "../lib/store";
import type { Outfit, Weekday } from "../lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Outfits() {
  const { data, dispatch, wearToday } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const today = weekdayIndex(new Date());
  const todayDate = todayKey();
  const [renaming, setRenaming] = useState<string | null>(null);

  const byId = useMemo(() => new Map(data.outfits.map((o) => [o.id, o])), [data.outfits]);
  const plannedToday = data.plan[today] ? byId.get(data.plan[today]!) : undefined;

  const tryOn = (o: Outfit) => {
    dispatch({ type: "setLook", look: o.look });
    navigate("/");
  };

  const markWorn = (o: Outfit) => {
    if (o.wornDates.includes(todayDate)) {
      toast("Already marked as worn today");
      return;
    }
    wearToday(o.id);
    toast(`Marked “${o.name}” as worn today`);
  };

  const remove = (o: Outfit) => {
    if (window.confirm(`Delete the look “${o.name}”?`)) {
      dispatch({ type: "deleteOutfit", id: o.id });
      toast(`Deleted “${o.name}”`);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Outfits</span>
          <h1>Saved looks &amp; week plan</h1>
          <p className="muted">{data.outfits.length} saved looks</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          <Icon name="plus" size={16} /> Create a look
        </button>
      </header>

      <section className="planner" aria-label="Week planner">
        <div className="planner-head">
          <h2 className="mini-title"><Icon name="calendar" size={16} /> This week</h2>
          {plannedToday ? (
            <span className="today-pill">Today: <strong>{plannedToday.name}</strong></span>
          ) : (
            <span className="muted small">Nothing planned for today</span>
          )}
        </div>
        <div className="week">
          {DAYS.map((label, i) => {
            const day = i as Weekday;
            const outfit = data.plan[day] ? byId.get(data.plan[day]!) : undefined;
            return (
              <div key={label} className={`day-col ${i === today ? "today" : ""}`}>
                <span className="day-label">{label}{i === today && <em> · today</em>}</span>
                <div className="day-avatar">
                  {outfit ? (
                    <button className="plain" onClick={() => tryOn(outfit)} aria-label={`Try on ${outfit.name}`}>
                      <Avatar avatar={data.avatar} worn={lookItems(outfit.look, data.items)} className="mini-avatar" title={outfit.name} />
                    </button>
                  ) : (
                    <span className="day-empty">—</span>
                  )}
                </div>
                <select value={outfit?.id ?? ""} onChange={(e) => dispatch({ type: "plan", day, outfitId: e.target.value || null })} aria-label={`Outfit for ${label}`}>
                  <option value="">No plan</option>
                  {data.outfits.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      </section>

      {data.outfits.length === 0 ? (
        <EmptyState title="No saved looks yet" text="Dress your avatar in the studio and press Save look." action={<button className="btn btn-primary" onClick={() => navigate("/")}>Open studio</button>} />
      ) : (
        <div className="outfit-grid">
          {data.outfits.map((o) => {
            const items = lookItems(o.look, data.items);
            const wornToday = o.wornDates.includes(todayDate);
            return (
              <article key={o.id} className="outfit-card">
                <button className="outfit-preview plain" onClick={() => tryOn(o)} aria-label={`Try on ${o.name}`}>
                  <Avatar avatar={data.avatar} worn={items} className="outfit-avatar" title={o.name} />
                </button>
                <div className="outfit-body">
                  {renaming === o.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); setRenaming(null); }}>
                      <input
                        className="rename"
                        autoFocus
                        defaultValue={o.name}
                        maxLength={40}
                        onBlur={(e) => { dispatch({ type: "renameOutfit", id: o.id, name: e.target.value.trim() || o.name }); setRenaming(null); }}
                        aria-label="Look name"
                      />
                    </form>
                  ) : (
                    <h3>{o.name}</h3>
                  )}
                  <p className="muted small">{items.length} items · worn {o.wornDates.length}×</p>
                  <div className="outfit-items">
                    {items.map((i) => <span key={i.id} className="dot" style={{ background: i.color }} title={i.name} />)}
                  </div>
                  <div className="outfit-actions">
                    <button className="btn btn-sm btn-primary" onClick={() => tryOn(o)}>Try on</button>
                    <button className={`btn btn-sm ${wornToday ? "btn-done" : "btn-ghost"}`} onClick={() => markWorn(o)}>
                      <Icon name="check" size={14} /> {wornToday ? "Worn today" : "Wore it"}
                    </button>
                    <button className="icon-btn" onClick={() => setRenaming(o.id)} aria-label={`Rename ${o.name}`}><Icon name="edit" size={16} /></button>
                    <button className="icon-btn danger" onClick={() => remove(o)} aria-label={`Delete ${o.name}`}><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
