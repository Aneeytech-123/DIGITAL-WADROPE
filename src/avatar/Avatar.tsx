import { memo, useId, useLayoutEffect, useRef, useState } from "react";
import { slotFor } from "../lib/catalog";
import { usePhotoUrl } from "../lib/store";
import type { Avatar as AvatarData, HairStyle, Item, Slot } from "../lib/types";
import { CX, VIEW_H, VIEW_W, Y, along, bodyFor, legsPath, sleevePath, torsoPath, type Body } from "./geometry";
import { DesignedGarment, shade } from "./garments";

/** Back-to-front drawing order of the slots. */
export const LAYER_ORDER: Slot[] = ["shoes", "bottom", "top", "dress", "outer", "neck", "bag", "wrist", "eyes", "head"];

function hairBack(style: HairStyle, color: string) {
  const h = Y.head;
  switch (style) {
    case "long":
      return <path d={`M ${CX - 36} ${h - 8} Q ${CX - 44} ${h - 52} ${CX} ${h - 48} Q ${CX + 44} ${h - 52} ${CX + 36} ${h - 8} L ${CX + 42} ${Y.shoulder + 46} Q ${CX} ${Y.shoulder + 58} ${CX - 42} ${Y.shoulder + 46} Z`} fill={color} />;
    case "bob":
      return <path d={`M ${CX - 37} ${h - 8} Q ${CX - 42} ${h - 50} ${CX} ${h - 47} Q ${CX + 42} ${h - 50} ${CX + 37} ${h - 8} L ${CX + 39} ${h + 36} Q ${CX} ${h + 44} ${CX - 39} ${h + 36} Z`} fill={color} />;
    case "curly":
      return (
        <g fill={color}>
          {[-36, -24, -10, 6, 20, 32].map((dx, i) => (
            <circle key={i} cx={CX + dx} cy={h + 14 + (i % 2) * 6} r="13" />
          ))}
        </g>
      );
    default:
      return null;
  }
}

function hairFront(style: HairStyle, color: string) {
  const h = Y.head;
  switch (style) {
    case "buzz":
      return <path d={`M ${CX - 32} ${h - 6} Q ${CX - 34} ${h - 44} ${CX} ${h - 42} Q ${CX + 34} ${h - 44} ${CX + 32} ${h - 6} Q ${CX + 30} ${h - 30} ${CX} ${h - 32} Q ${CX - 30} ${h - 30} ${CX - 32} ${h - 6} Z`} fill={color} opacity="0.85" />;
    case "long":
    case "bob":
      return <path d={`M ${CX - 34} ${h + 10} Q ${CX - 38} ${h - 48} ${CX} ${h - 46} Q ${CX + 38} ${h - 48} ${CX + 34} ${h + 10} Q ${CX + 30} ${h - 18} ${CX + 12} ${h - 24} Q ${CX - 4} ${h - 14} ${CX - 22} ${h - 22} Q ${CX - 32} ${h - 14} ${CX - 34} ${h + 10} Z`} fill={color} />;
    case "bun":
      return (
        <>
          <circle cx={CX} cy={h - 50} r="15" fill={color} />
          <path d={`M ${CX - 33} ${h - 2} Q ${CX - 36} ${h - 46} ${CX} ${h - 44} Q ${CX + 36} ${h - 46} ${CX + 33} ${h - 2} Q ${CX + 28} ${h - 26} ${CX} ${h - 28} Q ${CX - 28} ${h - 26} ${CX - 33} ${h - 2} Z`} fill={color} />
        </>
      );
    case "curly":
      return (
        <g fill={color}>
          {[-30, -18, -6, 6, 18, 30].map((dx, i) => (
            <circle key={i} cx={CX + dx} cy={h - 34 - (i === 2 || i === 3 ? 6 : 0)} r="12" />
          ))}
          {[-34, 34].map((dx) => (
            <circle key={dx} cx={CX + dx} cy={h - 14} r="10" />
          ))}
        </g>
      );
    case "short":
    default:
      return <path d={`M ${CX - 34} ${h - 2} Q ${CX - 37} ${h - 50} ${CX} ${h - 47} Q ${CX + 37} ${h - 50} ${CX + 34} ${h - 2} Q ${CX + 30} ${h - 26} ${CX + 10} ${h - 30} Q ${CX - 18} ${h - 36} ${CX - 34} ${h - 2} Z`} fill={color} />;
  }
}

function BaseBody({ avatar, body, uid }: { avatar: AvatarData; body: Body; uid: string }) {
  const skin = avatar.skin;
  const line = shade(skin, -0.28);
  const under = "#e9e4dc";
  return (
    <g>
      {hairBack(avatar.hair, avatar.hairColor)}
      {/* legs + feet */}
      <path d={legsPath(body, Y.hip - 10, Y.ankle + 6, 0)} fill={skin} stroke={line} strokeWidth="1.2" strokeLinejoin="round" />
      {([-1, 1] as const).map((s) => {
        const x = body.leg(s).ankleCenter.x;
        return <ellipse key={s} cx={x + s * 6} cy={Y.foot} rx="15" ry="8" fill={skin} stroke={line} strokeWidth="1.1" />;
      })}
      {/* arms + hands */}
      {([-1, 1] as const).map((s) => {
        const d = sleevePath(body, s, 1);
        const hand = body.arm(s).hand;
        return (
          <g key={s}>
            <path d={d} stroke={line} strokeWidth={body.w.arm * 2 + 2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} stroke={skin} strokeWidth={body.w.arm * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx={hand.x} cy={hand.y} rx={body.w.arm * 0.95} ry={body.w.arm * 1.25} fill={skin} stroke={line} strokeWidth="1.1" />
          </g>
        );
      })}
      {/* torso */}
      <path d={torsoPath(body, Y.crotch - 4, 0, { w: 11, depth: 0 })} fill={skin} stroke={line} strokeWidth="1.2" strokeLinejoin="round" />
      <path d={torsoPath(body, Y.crotch - 4, 0, { w: 11, depth: 0 })} fill={`url(#${uid}-shade)`} />
      {/* neutral base layer (shown when nothing is worn) */}
      <path d={legsPath(body, Y.hip - 18, Y.crotch + 18, 1)} fill={under} stroke={shade(under, -0.25)} strokeWidth="1" />
      <path d={`M ${CX - body.half(Y.chest) - 1} ${Y.chest - 4} L ${CX + body.half(Y.chest) + 1} ${Y.chest - 4} L ${CX + body.half(Y.chest + 26) + 1} ${Y.chest + 26} L ${CX - body.half(Y.chest + 26) - 1} ${Y.chest + 26} Z`} fill={under} stroke={shade(under, -0.25)} strokeWidth="1" />
      {/* neck */}
      <path d={`M ${CX - 11} ${Y.head + 26} L ${CX - 12} ${Y.neckBottom + 6} Q ${CX} ${Y.neckBottom + 12} ${CX + 12} ${Y.neckBottom + 6} L ${CX + 11} ${Y.head + 26} Z`} fill={shade(skin, -0.06)} stroke={line} strokeWidth="1.1" />
      {/* head */}
      {([-1, 1] as const).map((s) => (
        <ellipse key={s} cx={CX + s * 31} cy={Y.head + 4} rx="6" ry="9" fill={skin} stroke={line} strokeWidth="1.1" />
      ))}
      <ellipse cx={CX} cy={Y.head} rx="31" ry="37" fill={skin} stroke={line} strokeWidth="1.2" />
      {([-1, 1] as const).map((s) => (
        <g key={`e${s}`}>
          <ellipse cx={CX + s * 12} cy={Y.head + 3} rx="3.3" ry="3.8" fill="#1c1714" />
          <circle cx={CX + s * 12 + 1} cy={Y.head + 2} r="1" fill="#fff" />
          <path d={`M ${CX + s * 6} ${Y.head - 8} Q ${CX + s * 12} ${Y.head - 12} ${CX + s * 18} ${Y.head - 8}`} stroke={avatar.hairColor} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <ellipse cx={CX + s * 18} cy={Y.head + 14} rx="5" ry="3" fill="#e0756b" opacity="0.18" />
        </g>
      ))}
      <path d={`M ${CX - 1} ${Y.head + 6} Q ${CX + 3} ${Y.head + 14} ${CX - 2} ${Y.head + 16}`} stroke={line} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d={`M ${CX - 9} ${Y.head + 23} Q ${CX} ${Y.head + 30} ${CX + 9} ${Y.head + 23}`} stroke={shade(skin, -0.45)} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Box (in avatar units) that a photo item is fitted into, by slot. */
export function photoBox(slot: Slot, body: Body): { x: number; y: number; w: number; h: number } {
  const sh = body.w.shoulder;
  switch (slot) {
    case "top":
      return { x: CX - sh - 16, y: Y.neckBottom - 8, w: (sh + 16) * 2, h: Y.hip - Y.neckBottom + 10 };
    case "outer":
      return { x: CX - sh - 24, y: Y.neckBottom - 10, w: (sh + 24) * 2, h: Y.hip + 44 - Y.neckBottom };
    case "bottom":
      return { x: CX - body.w.hip - 12, y: Y.waist + 4, w: (body.w.hip + 12) * 2, h: Y.ankle - Y.waist + 4 };
    case "dress":
      return { x: CX - sh - 18, y: Y.neckBottom - 6, w: (sh + 18) * 2, h: Y.knee + 40 - Y.neckBottom };
    case "shoes":
      return { x: CX - 56, y: Y.ankle - 16, w: 112, h: 44 };
    case "head":
      return { x: CX - 42, y: Y.head - 66, w: 84, h: 56 };
    case "eyes":
      return { x: CX - 34, y: Y.head - 8, w: 68, h: 24 };
    case "neck":
      return { x: CX - 36, y: Y.neckBottom - 16, w: 72, h: 84 };
    case "bag": {
      const hand = body.arm(1).hand;
      return { x: hand.x - 10, y: hand.y - 28, w: 60, h: 84 };
    }
    case "wrist": {
      const a = body.arm(-1);
      const w = along(a.elbow, a.wrist, 0.86);
      return { x: w.x - 10, y: w.y - 10, w: 20, h: 20 };
    }
  }
}

function PhotoGarment({ item, body }: { item: Item; body: Body }) {
  const url = usePhotoUrl(item.photoId);
  if (!url) return null;
  const box = photoBox(slotFor(item), body);
  const fit = item.photoFit ?? { scale: 1, x: 0, y: 0 };
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return (
    <g data-item={item.id} transform={`translate(${fit.x} ${fit.y}) translate(${cx} ${cy}) scale(${fit.scale}) translate(${-cx} ${-cy})`}>
      <image href={url} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="xMidYMid meet" />
    </g>
  );
}

export function Garment({ item, body, uid }: { item: Item; body: Body; uid: string }) {
  return item.kind === "photo" ? <PhotoGarment item={item} body={body} /> : <DesignedGarment item={item} body={body} uid={uid} />;
}

interface Props {
  avatar: AvatarData;
  worn: Item[];
  className?: string;
  title?: string;
}

function AvatarView({ avatar, worn, className, title }: Props) {
  const uid = useId().replace(/:/g, "");
  const body = bodyFor(avatar.body);
  const bySlot = new Map<Slot, Item>();
  for (const item of worn) bySlot.set(slotFor(item), item);
  const ground = VIEW_H - 32;

  return (
    <svg className={className} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={title ?? (avatar.name.trim() ? `${avatar.name.trim()}’s avatar` : "Your avatar")}>
      <defs>
        <linearGradient id={`${uid}-shade`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id={`${uid}-floor`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={CX} cy={ground + 8} rx={86 * avatar.height} ry="12" fill={`url(#${uid}-floor)`} />
      <g transform={`translate(${CX} ${ground}) scale(${avatar.height}) translate(${-CX} ${-ground}) translate(0 ${ground - Y.foot - 8})`}>
        <BaseBody avatar={avatar} body={body} uid={uid} />
        {LAYER_ORDER.filter((s) => s !== "eyes" && s !== "head").map((slot) => {
          const item = bySlot.get(slot);
          return item ? <Garment key={slot} item={item} body={body} uid={uid} /> : null;
        })}
        {hairFront(avatar.hair, avatar.hairColor)}
        {(["eyes", "head"] as Slot[]).map((slot) => {
          const item = bySlot.get(slot);
          return item ? <Garment key={slot} item={item} body={body} uid={uid} /> : null;
        })}
      </g>
    </svg>
  );
}

export const Avatar = memo(AvatarView);

/** Small preview of one item on its own (used on wardrobe cards). */
function ItemThumbView({ item, className }: { item: Item; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const ref = useRef<SVGGElement>(null);
  const [box, setBox] = useState<string>(() => {
    const b = photoBox(slotFor(item), bodyFor("regular"));
    return `${b.x} ${b.y} ${b.w} ${b.h}`;
  });
  const url = usePhotoUrl(item.kind === "photo" ? item.photoId : undefined);

  useLayoutEffect(() => {
    if (item.kind === "photo" || !ref.current) return;
    try {
      const b = ref.current.getBBox();
      if (b.width > 0 && b.height > 0) {
        const pad = Math.max(b.width, b.height) * 0.08;
        const size = Math.max(b.width, b.height) + pad * 2;
        setBox(`${b.x + b.width / 2 - size / 2} ${b.y + b.height / 2 - size / 2} ${size} ${size}`);
      }
    } catch {
      /* getBBox can fail when not rendered */
    }
  }, [item]);

  if (item.kind === "photo") {
    return url ? <img className={className} src={url} alt="" draggable={false} /> : <div className={`${className} thumb-empty`} />;
  }

  return (
    <svg className={className} viewBox={box} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-shade`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.12" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
      </defs>
      <g ref={ref}>
        <DesignedGarment item={item} body={bodyFor("regular")} uid={uid} />
      </g>
    </svg>
  );
}

export const ItemThumb = memo(ItemThumbView);
