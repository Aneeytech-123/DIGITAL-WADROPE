import type { ReactNode } from "react";
import type { Item, Pattern } from "../lib/types";
import { CX, Y, along, bodyFor, legsPath, p, skirtPath, sleevePath, torsoPath, type Body, type Pt } from "./geometry";

/** Darkens (amount < 0) or lightens (amount > 0) a hex colour. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)))
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** SVG <pattern> used to paint a garment. */
export function PatternDef({ id, pattern, color, color2 }: { id: string; pattern: Pattern; color: string; color2: string }) {
  switch (pattern) {
    case "stripes":
      return (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={color} />
          <rect width="12" height="4" fill={color2} />
        </pattern>
      );
    case "checks":
      return (
        <pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill={color} />
          <rect width="20" height="7" y="6" fill={color2} opacity="0.55" />
          <rect width="7" height="20" x="6" fill={color2} opacity="0.55" />
          <rect width="20" height="1" y="9" fill={shade(color2, 0.4)} opacity="0.6" />
        </pattern>
      );
    case "dots":
      return (
        <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill={color} />
          <circle cx="3.5" cy="3.5" r="2.2" fill={color2} />
          <circle cx="10.5" cy="10.5" r="2.2" fill={color2} />
        </pattern>
      );
    case "denim":
      return (
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="6" height="6" fill={color} />
          <rect width="6" height="1.4" fill={shade(color, 0.18)} opacity="0.7" />
          <rect width="6" height="1" y="3.5" fill={shade(color, -0.2)} opacity="0.5" />
        </pattern>
      );
    case "knit":
      return (
        <pattern id={id} width="8" height="10" patternUnits="userSpaceOnUse">
          <rect width="8" height="10" fill={color} />
          <path d="M0 0 L4 5 L8 0 M0 5 L4 10 L8 5" fill="none" stroke={shade(color, -0.14)} strokeWidth="1.1" />
        </pattern>
      );
    default:
      return (
        <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill={color} />
        </pattern>
      );
  }
}

interface Ctx {
  body: Body;
  paint: string;
  line: string;
  accent: string;
  shadeId: string;
}

function Fill({ d, c, shadeOn = true }: { d: string; c: Ctx; shadeOn?: boolean }) {
  return (
    <>
      <path d={d} fill={c.paint} stroke={c.line} strokeWidth="1.3" strokeLinejoin="round" />
      {shadeOn && <path d={d} fill={`url(#${c.shadeId})`} pointerEvents="none" />}
    </>
  );
}

function Sleeves({ c, length, width }: { c: Ctx; length: number; width: number }) {
  return (
    <>
      {([-1, 1] as const).map((s) => {
        const d = sleevePath(c.body, s, length);
        return (
          <g key={s}>
            <path d={d} fill="none" stroke={c.line} strokeWidth={width + 2.6} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke={c.paint} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </>
  );
}

function Cuffs({ c, length, width }: { c: Ctx; length: number; width: number }) {
  return (
    <>
      {([-1, 1] as const).map((s) => {
        const a = c.body.arm(s);
        const end = length > 0.5 ? along(a.elbow, a.wrist, (length - 0.5) * 2) : along(a.shoulder, a.elbow, length * 2);
        const before = length > 0.5 ? along(a.elbow, a.wrist, (length - 0.5) * 2 - 0.09) : along(a.shoulder, a.elbow, length * 2 - 0.12);
        return <path key={s} d={`M ${p(before)} L ${p(end)}`} stroke={c.accent} strokeWidth={width + 0.5} strokeLinecap="butt" fill="none" opacity="0.9" />;
      })}
    </>
  );
}

/** Sleeveless bodice (tank top / dress top) down to hemY. */
function bodicePath(body: Body, hemY: number, off: number): string {
  const top = Y.neckBottom + 1;
  const chestH = body.half(Y.chest) + off;
  const pts: Pt[] = [];
  for (let y = Y.chest + 6; y <= hemY; y += 8) pts.push({ x: CX + body.half(y) + off, y });
  pts.push({ x: CX + body.half(hemY) + off, y: hemY });
  let d = `M ${CX - 21} ${top} L ${CX - 31} ${top}`;
  d += ` Q ${CX - chestH} ${Y.chest - 22} ${CX - chestH} ${Y.chest + 6}`;
  for (const pt of pts) d += ` L ${CX - (pt.x - CX)} ${pt.y}`;
  d += ` Q ${CX} ${hemY + 4} ${p(pts[pts.length - 1])}`;
  for (let i = pts.length - 2; i >= 0; i--) d += ` L ${p(pts[i])}`;
  d += ` Q ${CX + chestH} ${Y.chest - 22} ${CX + 31} ${top} L ${CX + 21} ${top}`;
  d += ` Q ${CX} ${top + 36} ${CX - 21} ${top} Z`;
  return d;
}

/** One front panel of an open jacket/coat. side -1 = wearer's right (screen left). */
function panelPath(body: Body, side: -1 | 1, hemY: number, off: number, gapTop: number, gapBottom: number, flare = 0): string {
  const top = Y.neckBottom + 1;
  const sh = body.w.shoulder + off - 2;
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let y = Y.shoulder + 8; y <= hemY; y += 8) {
    const t = (y - Y.shoulder) / (hemY - Y.shoulder);
    outer.push({ x: CX + side * (body.half(y) + off + flare * t * t), y });
    inner.push({ x: CX + side * (gapTop + (gapBottom - gapTop) * Math.min(1, t * 1.6)), y });
  }
  outer.push({ x: CX + side * (body.half(hemY) + off + flare), y: hemY });
  inner.push({ x: CX + side * gapBottom, y: hemY });
  let d = `M ${CX + side * gapTop} ${top}`;
  d += ` Q ${CX + side * (sh - 6)} ${top + 1} ${CX + side * sh} ${Y.shoulder + 8}`;
  for (const pt of outer) d += ` L ${p(pt)}`;
  for (let i = inner.length - 1; i >= 0; i--) d += ` L ${p(inner[i])}`;
  d += " Z";
  return d;
}

function Collar({ c, spread = 15 }: { c: Ctx; spread?: number }) {
  const top = Y.neckBottom;
  return (
    <>
      {([-1, 1] as const).map((s) => (
        <path
          key={s}
          d={`M ${CX + s * 4} ${top + 16} L ${CX + s * spread} ${top - 3} L ${CX + s * (spread + 6)} ${top + 12} Z`}
          fill={c.paint}
          stroke={c.line}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      ))}
    </>
  );
}

function Buttons({ c, from, to, count }: { c: Ctx; from: number; to: number; count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <circle key={i} cx={CX} cy={from + ((to - from) * i) / Math.max(1, count - 1)} r="1.9" fill={c.accent} stroke={c.line} strokeWidth="0.6" />
      ))}
    </>
  );
}

const TOP_HEM = Y.hip - 4;

function renderTop(item: Item, c: Ctx): ReactNode {
  const arm = c.body.w.arm * 2;
  switch (item.template) {
    case "tank":
      return <Fill d={bodicePath(c.body, TOP_HEM, 2)} c={c} />;
    case "tee":
      return (
        <>
          <Sleeves c={c} length={0.42} width={arm + 9} />
          <Fill d={torsoPath(c.body, TOP_HEM, 3, { w: 15, depth: 6 })} c={c} />
          <path d={`M ${CX - 15} ${Y.neckBottom + 2} Q ${CX} ${Y.neckBottom + 13} ${CX + 15} ${Y.neckBottom + 2}`} stroke={c.accent} strokeWidth="2.4" fill="none" />
        </>
      );
    case "longsleeve":
      return (
        <>
          <Sleeves c={c} length={1} width={arm + 7} />
          <Fill d={torsoPath(c.body, TOP_HEM, 3, { w: 14, depth: 5 })} c={c} />
        </>
      );
    case "sweater":
      return (
        <>
          <Sleeves c={c} length={1} width={arm + 10} />
          <Cuffs c={c} length={1} width={arm + 10} />
          <Fill d={torsoPath(c.body, TOP_HEM + 6, 5, { w: 15, depth: 5 })} c={c} />
          <path d={`M ${CX - c.body.half(TOP_HEM) - 5} ${TOP_HEM - 4} L ${CX + c.body.half(TOP_HEM) + 5} ${TOP_HEM - 4}`} stroke={c.accent} strokeWidth="9" />
          <path d={`M ${CX - 15} ${Y.neckBottom + 2} Q ${CX} ${Y.neckBottom + 12} ${CX + 15} ${Y.neckBottom + 2}`} stroke={c.accent} strokeWidth="4" fill="none" />
        </>
      );
    case "hoodie":
      return (
        <>
          <path d={`M ${CX - 34} ${Y.neckBottom + 8} Q ${CX - 38} ${Y.neckBottom - 14} ${CX - 20} ${Y.neckBottom - 12} Q ${CX} ${Y.neckBottom + 6} ${CX + 20} ${Y.neckBottom - 12} Q ${CX + 38} ${Y.neckBottom - 14} ${CX + 34} ${Y.neckBottom + 8} Z`} fill={shade(item.color, -0.18)} stroke={c.line} strokeWidth="1.2" />
          <Sleeves c={c} length={1} width={arm + 11} />
          <Cuffs c={c} length={1} width={arm + 11} />
          <Fill d={torsoPath(c.body, TOP_HEM + 8, 6, { w: 16, depth: 7 })} c={c} />
          <path d={`M ${CX - 30} ${Y.waist + 4} L ${CX + 30} ${Y.waist + 4} L ${CX + 36} ${Y.hip - 2} L ${CX - 36} ${Y.hip - 2} Z`} fill="none" stroke={c.line} strokeWidth="1.2" opacity="0.8" />
          <path d={`M ${CX - 7} ${Y.neckBottom + 8} L ${CX - 9} ${Y.chest + 6} M ${CX + 7} ${Y.neckBottom + 8} L ${CX + 9} ${Y.chest + 6}`} stroke={c.accent} strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "polo":
      return (
        <>
          <Sleeves c={c} length={0.42} width={arm + 9} />
          <Cuffs c={c} length={0.42} width={arm + 9} />
          <Fill d={torsoPath(c.body, TOP_HEM, 3, { w: 13, depth: 4 })} c={c} />
          <path d={`M ${CX} ${Y.neckBottom + 6} L ${CX} ${Y.chest - 6}`} stroke={c.line} strokeWidth="1" />
          <Buttons c={c} from={Y.neckBottom + 12} to={Y.chest - 10} count={2} />
          <Collar c={c} spread={14} />
        </>
      );
    case "shirt":
    default:
      return (
        <>
          <Sleeves c={c} length={1} width={arm + 8} />
          <Cuffs c={c} length={1} width={arm + 8} />
          <Fill d={torsoPath(c.body, TOP_HEM + 4, 3, { w: 12, depth: 4 })} c={c} />
          <path d={`M ${CX} ${Y.neckBottom + 10} L ${CX} ${TOP_HEM + 4}`} stroke={c.line} strokeWidth="1" />
          <Buttons c={c} from={Y.neckBottom + 18} to={TOP_HEM - 8} count={5} />
          <Collar c={c} />
        </>
      );
  }
}

function renderOuter(item: Item, c: Ctx): ReactNode {
  const arm = c.body.w.arm * 2;
  const long = item.template === "coat";
  const hem = long ? Y.knee + 18 : item.template === "blazer" ? Y.hip + 26 : Y.hip + 12;
  const flare = long ? 12 : 0;
  const gapTop = item.template === "blazer" ? 10 : 14;
  const gapBottom = item.template === "blazer" ? 3 : 7;
  return (
    <>
      <Sleeves c={c} length={1} width={arm + 15} />
      <Cuffs c={c} length={1} width={arm + 15} />
      {([-1, 1] as const).map((s) => (
        <Fill key={s} d={panelPath(c.body, s, hem, 8, gapTop, gapBottom, flare)} c={c} />
      ))}
      {item.template === "blazer" || item.template === "coat" ? (
        ([-1, 1] as const).map((s) => (
          <path
            key={`lapel${s}`}
            d={`M ${CX + s * gapTop} ${Y.neckBottom + 1} L ${CX + s * 26} ${Y.neckBottom + 6} L ${CX + s * 20} ${Y.chest + 4} L ${CX + s * 6} ${Y.chest + 40} Z`}
            fill={shade(item.color, -0.12)}
            stroke={c.line}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        ))
      ) : (
        <>
          {([-1, 1] as const).map((s) => (
            <g key={`p${s}`}>
              <path d={`M ${CX + s * 20} ${Y.chest} L ${CX + s * 38} ${Y.chest} L ${CX + s * 38} ${Y.chest + 18} L ${CX + s * 20} ${Y.chest + 18} Z`} fill="none" stroke={c.line} strokeWidth="1.1" />
              <path d={`M ${CX + s * gapTop} ${Y.neckBottom} L ${CX + s * 30} ${Y.neckBottom + 4} L ${CX + s * 20} ${Y.neckBottom + 22} Z`} fill={shade(item.color, -0.1)} stroke={c.line} strokeWidth="1" />
            </g>
          ))}
          <path d={`M ${CX - c.body.half(hem) - 8} ${hem - 9} L ${CX - gapBottom} ${hem - 9} M ${CX + gapBottom} ${hem - 9} L ${CX + c.body.half(hem) + 8} ${hem - 9}`} stroke={c.line} strokeWidth="1" />
        </>
      )}
      {item.template === "blazer" && <circle cx={CX + 6} cy={Y.waist + 4} r="2.6" fill={c.accent} stroke={c.line} strokeWidth="0.6" />}
      {item.template === "coat" && (
        <>
          <path d={`M ${CX - c.body.half(Y.waist) - 9} ${Y.waist} L ${CX + c.body.half(Y.waist) + 9} ${Y.waist}`} stroke={shade(item.color, -0.2)} strokeWidth="9" />
          <Buttons c={c} from={Y.chest + 50} to={Y.hip + 40} count={3} />
        </>
      )}
    </>
  );
}

function renderBottom(item: Item, c: Ctx): ReactNode {
  const waistY = Y.waist + 8;
  switch (item.template) {
    case "skirt":
      return <Fill d={skirtPath(c.body, waistY, Y.crotch + 46, 16)} c={c} />;
    case "midiskirt":
      return <Fill d={skirtPath(c.body, waistY, Y.knee + 48, 30)} c={c} />;
    case "shorts":
      return (
        <>
          <Fill d={legsPath(c.body, waistY, Y.crotch + 58, 6)} c={c} />
          <path d={`M ${CX - c.body.half(waistY) - 6} ${waistY + 6} L ${CX + c.body.half(waistY) + 6} ${waistY + 6}`} stroke={c.line} strokeWidth="1" />
        </>
      );
    case "joggers":
      return (
        <>
          <Fill d={legsPath(c.body, waistY, Y.ankle - 4, 6, 3)} c={c} />
          <path d={`M ${CX - c.body.half(waistY) - 6} ${waistY + 4} L ${CX + c.body.half(waistY) + 6} ${waistY + 4}`} stroke={c.accent} strokeWidth="7" />
          {([-1, 1] as const).map((s) => {
            const leg = c.body.leg(s);
            return <path key={s} d={`M ${leg.ankleCenter.x - 12} ${Y.ankle - 10} L ${leg.ankleCenter.x + 12} ${Y.ankle - 10}`} stroke={c.accent} strokeWidth="8" />;
          })}
        </>
      );
    case "trousers":
      return (
        <>
          <Fill d={legsPath(c.body, waistY, Y.ankle + 2, 7)} c={c} />
          {([-1, 1] as const).map((s) => {
            const leg = c.body.leg(s);
            return <path key={s} d={`M ${(leg.hipOuter.x + leg.crotch.x) / 2} ${Y.hip} L ${leg.ankleCenter.x} ${Y.ankle}`} stroke={c.line} strokeWidth="0.9" opacity="0.6" />;
          })}
          <path d={`M ${CX - c.body.half(waistY) - 7} ${waistY + 5} L ${CX + c.body.half(waistY) + 7} ${waistY + 5}`} stroke={c.line} strokeWidth="1" />
        </>
      );
    case "jeans":
    default:
      return (
        <>
          <Fill d={legsPath(c.body, waistY, Y.ankle, 5)} c={c} />
          <path d={`M ${CX - c.body.half(waistY) - 5} ${waistY + 6} L ${CX + c.body.half(waistY) + 5} ${waistY + 6}`} stroke={c.accent} strokeWidth="1.4" />
          <path d={`M ${CX + 2} ${waistY + 6} Q ${CX + 10} ${Y.hip - 6} ${CX + 2} ${Y.crotch - 6}`} stroke={c.accent} strokeWidth="1.2" fill="none" />
          {([-1, 1] as const).map((s) => (
            <path key={s} d={`M ${CX + s * (c.body.half(waistY) - 4)} ${waistY + 8} Q ${CX + s * (c.body.half(waistY) - 16)} ${waistY + 26} ${CX + s * 14} ${waistY + 8}`} stroke={c.accent} strokeWidth="1.2" fill="none" />
          ))}
        </>
      );
  }
}

function renderDress(item: Item, c: Ctx): ReactNode {
  const maxi = item.template === "maxidress";
  const hem = maxi ? Y.ankle - 6 : Y.knee + 14;
  return (
    <>
      <Fill d={skirtPath(c.body, Y.waist - 2, hem, maxi ? 44 : 26)} c={c} />
      <Fill d={bodicePath(c.body, Y.waist + 2, 2)} c={c} />
      <path d={`M ${CX - c.body.half(Y.waist) - 3} ${Y.waist} L ${CX + c.body.half(Y.waist) + 3} ${Y.waist}`} stroke={c.accent} strokeWidth="4" />
    </>
  );
}

function renderShoes(item: Item, c: Ctx): ReactNode {
  return (
    <>
      {([-1, 1] as const).map((s) => {
        const x = c.body.leg(s).ankleCenter.x;
        const f = Y.foot;
        const sole = `M ${x - s * 12} ${f + 7} L ${x + s * 24} ${f + 7}`;
        switch (item.template) {
          case "boots":
            return (
              <g key={s}>
                <path d={`M ${x - s * 11} ${Y.ankle - 40} L ${x + s * 11} ${Y.ankle - 40} L ${x + s * 12} ${f - 8} Q ${x + s * 26} ${f - 6} ${x + s * 26} ${f + 4} L ${x - s * 13} ${f + 4} Z`} fill={c.paint} stroke={c.line} strokeWidth="1.2" strokeLinejoin="round" />
                <path d={`M ${x - s * 14} ${f + 4} L ${x + s * 26} ${f + 4} L ${x + s * 26} ${f + 9} L ${x - s * 14} ${f + 9} Z`} fill={shade(item.color, -0.35)} />
                <path d={`M ${x - s * 2} ${Y.ankle - 36} L ${x - s * 2} ${Y.ankle - 6}`} stroke={c.accent} strokeWidth="3" opacity="0.6" />
              </g>
            );
          case "heels":
            return (
              <g key={s}>
                <path d={`M ${x - s * 9} ${f - 10} Q ${x + s * 8} ${f - 4} ${x + s * 24} ${f + 4} L ${x + s * 22} ${f + 7} L ${x - s * 8} ${f + 1} Z`} fill={c.paint} stroke={c.line} strokeWidth="1.1" strokeLinejoin="round" />
                <path d={`M ${x - s * 8} ${f} L ${x - s * 9} ${f + 12}`} stroke={c.line} strokeWidth="2.6" strokeLinecap="round" />
              </g>
            );
          case "loafers":
            return (
              <g key={s}>
                <path d={`M ${x - s * 12} ${f - 6} Q ${x + s * 6} ${f - 12} ${x + s * 22} ${f - 2} Q ${x + s * 28} ${f + 4} ${x + s * 22} ${f + 6} L ${x - s * 12} ${f + 6} Z`} fill={c.paint} stroke={c.line} strokeWidth="1.2" strokeLinejoin="round" />
                <path d={`M ${x + s * 2} ${f - 7} L ${x + s * 14} ${f - 5}`} stroke={c.accent} strokeWidth="2.4" strokeLinecap="round" />
              </g>
            );
          case "sneakers":
          default:
            return (
              <g key={s}>
                <path d={`M ${x - s * 12} ${f - 10} Q ${x + s * 4} ${f - 16} ${x + s * 18} ${f - 4} Q ${x + s * 28} ${f} ${x + s * 26} ${f + 6} L ${x - s * 13} ${f + 6} Z`} fill={c.paint} stroke={c.line} strokeWidth="1.2" strokeLinejoin="round" />
                <path d={sole} stroke={c.accent} strokeWidth="4" strokeLinecap="round" />
                <path d={`M ${x - s * 2} ${f - 11} L ${x + s * 8} ${f - 8} M ${x + s * 1} ${f - 7} L ${x + s * 11} ${f - 4}`} stroke={c.line} strokeWidth="1.2" />
              </g>
            );
        }
      })}
    </>
  );
}

function renderAccessory(item: Item, c: Ctx): ReactNode {
  const hy = Y.head;
  switch (item.template) {
    case "cap":
      return (
        <>
          <path d={`M ${CX - 35} ${hy - 12} Q ${CX - 36} ${hy - 50} ${CX} ${hy - 52} Q ${CX + 36} ${hy - 50} ${CX + 35} ${hy - 12} Z`} fill={c.paint} stroke={c.line} strokeWidth="1.2" />
          <path d={`M ${CX - 40} ${hy - 12} Q ${CX} ${hy - 22} ${CX + 40} ${hy - 12} Q ${CX + 44} ${hy - 4} ${CX + 30} ${hy - 4} L ${CX - 30} ${hy - 4} Q ${CX - 44} ${hy - 4} ${CX - 40} ${hy - 12} Z`} fill={shade(item.color, -0.2)} stroke={c.line} strokeWidth="1.2" />
          <circle cx={CX} cy={hy - 51} r="3" fill={c.accent} />
        </>
      );
    case "beanie":
      return (
        <>
          <path d={`M ${CX - 36} ${hy - 10} Q ${CX - 38} ${hy - 58} ${CX} ${hy - 60} Q ${CX + 38} ${hy - 58} ${CX + 36} ${hy - 10} Z`} fill={c.paint} stroke={c.line} strokeWidth="1.2" />
          <path d={`M ${CX - 37} ${hy - 22} L ${CX + 37} ${hy - 22} L ${CX + 37} ${hy - 8} L ${CX - 37} ${hy - 8} Z`} fill={c.accent} stroke={c.line} strokeWidth="1.1" />
        </>
      );
    case "sunglasses":
      return (
        <>
          {([-1, 1] as const).map((s) => (
            <rect key={s} x={CX + s * 14 - 11} y={hy - 2} width="22" height="13" rx="5" fill={c.paint} stroke={c.line} strokeWidth="1.4" />
          ))}
          <path d={`M ${CX - 3} ${hy + 2} Q ${CX} ${hy - 1} ${CX + 3} ${hy + 2} M ${CX - 25} ${hy + 1} L ${CX - 31} ${hy - 1} M ${CX + 25} ${hy + 1} L ${CX + 31} ${hy - 1}`} stroke={c.line} strokeWidth="1.8" fill="none" />
          {([-1, 1] as const).map((s) => (
            <path key={`g${s}`} d={`M ${CX + s * 14 - 7} ${hy + 1} L ${CX + s * 14 - 2} ${hy + 1}`} stroke="#ffffff" strokeWidth="1.5" opacity="0.5" />
          ))}
        </>
      );
    case "scarf":
      return (
        <>
          <path d={`M ${CX - 28} ${Y.neckBottom - 8} Q ${CX} ${Y.neckBottom + 10} ${CX + 28} ${Y.neckBottom - 8} L ${CX + 30} ${Y.neckBottom + 6} Q ${CX} ${Y.neckBottom + 26} ${CX - 30} ${Y.neckBottom + 6} Z`} fill={c.paint} stroke={c.line} strokeWidth="1.2" />
          <path d={`M ${CX + 8} ${Y.neckBottom + 10} L ${CX + 22} ${Y.chest + 60} L ${CX + 6} ${Y.chest + 62} L ${CX - 2} ${Y.neckBottom + 14} Z`} fill={c.paint} stroke={c.line} strokeWidth="1.2" />
          <path d={`M ${CX + 7} ${Y.chest + 56} L ${CX + 21} ${Y.chest + 54}`} stroke={c.accent} strokeWidth="5" />
        </>
      );
    case "tote": {
      const hand = c.body.arm(1).hand;
      const bx = hand.x - 4;
      const by = hand.y - 6;
      return (
        <>
          <path d={`M ${bx + 6} ${by + 4} Q ${bx + 20} ${by - 28} ${bx + 34} ${by + 4}`} stroke={shade(item.color, -0.3)} strokeWidth="3" fill="none" />
          <path d={`M ${bx - 2} ${by + 4} L ${bx + 42} ${by + 4} L ${bx + 46} ${by + 58} L ${bx - 6} ${by + 58} Z`} fill={c.paint} stroke={c.line} strokeWidth="1.2" strokeLinejoin="round" />
          <path d={`M ${bx + 8} ${by + 24} L ${bx + 32} ${by + 24}`} stroke={c.accent} strokeWidth="1.4" opacity="0.7" />
        </>
      );
    }
    case "watch": {
      const a = c.body.arm(-1);
      const w = along(a.elbow, a.wrist, 0.86);
      return (
        <>
          <path d={`M ${w.x - 8} ${w.y} L ${w.x + 8} ${w.y + 2}`} stroke={shade(item.color2, -0.2)} strokeWidth="6" strokeLinecap="round" />
          <rect x={w.x - 5} y={w.y - 4} width="10" height="10" rx="2.5" fill={c.paint} stroke={c.line} strokeWidth="1" />
          <circle cx={w.x} cy={w.y + 1} r="2.6" fill="#f8fafc" />
        </>
      );
    }
    default:
      return null;
  }
}

/** Draws one designed (template-based) garment on the body. */
export function DesignedGarment({ item, body, uid }: { item: Item; body: Body; uid: string }) {
  const patId = `${uid}-pat-${item.id}`;
  const c: Ctx = {
    body,
    paint: `url(#${patId})`,
    line: shade(item.color, -0.42),
    accent: item.color2,
    shadeId: `${uid}-shade`,
  };
  let content: ReactNode;
  switch (item.category) {
    case "tops":
    case "shirts":
      content = renderTop(item, c);
      break;
    case "outerwear":
      content = renderOuter(item, c);
      break;
    case "pants":
    case "shorts":
    case "skirts":
      content = renderBottom(item, c);
      break;
    case "dresses":
      content = renderDress(item, c);
      break;
    case "shoes":
      content = renderShoes(item, c);
      break;
    case "accessories":
      content = renderAccessory(item, c);
      break;
  }
  return (
    <g data-item={item.id}>
      <defs>
        <PatternDef id={patId} pattern={item.pattern} color={item.color} color2={item.color2} />
      </defs>
      {content}
    </g>
  );
}

export { bodyFor };
