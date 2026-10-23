import { memo } from "react";
import { ItemThumb } from "../avatar/Avatar";
import { CATEGORY_LABELS } from "../lib/catalog";
import type { Item } from "../lib/types";
import { Icon } from "./ui";

interface Props {
  item: Item;
  active?: boolean;
  compact?: boolean;
  onClick: (item: Item) => void;
  onFavorite?: (item: Item) => void;
}

function ItemCardView({ item, active, compact, onClick, onFavorite }: Props) {
  return (
    <div className={`item-card ${active ? "active" : ""} ${compact ? "compact" : ""}`}>
      <button
        type="button"
        className="item-main"
        onClick={() => onClick(item)}
        aria-pressed={compact ? !!active : undefined}
        aria-label={compact ? `${active ? "Take off" : "Wear"} ${item.name}` : `Edit ${item.name}`}
      >
        <span className="item-thumb">
          <ItemThumb item={item} className="thumb" />
          {item.kind === "photo" && <span className="badge-photo">Photo</span>}
          {active && (
            <span className="badge-on">
              <Icon name="check" size={13} /> Wearing
            </span>
          )}
        </span>
        <span className="item-name">{item.name}</span>
        {!compact && (
          <span className="item-meta">
            {CATEGORY_LABELS[item.category]} · worn {item.wearCount}×
          </span>
        )}
      </button>
      {onFavorite && (
        <button type="button" className={`fav ${item.favorite ? "on" : ""}`} onClick={() => onFavorite(item)} aria-label={item.favorite ? `Unfavourite ${item.name}` : `Favourite ${item.name}`} aria-pressed={item.favorite}>
          <Icon name="heart" size={15} filled={item.favorite} />
        </button>
      )}
    </div>
  );
}

export const ItemCard = memo(ItemCardView);
