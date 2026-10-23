import type { BodyShape } from "../lib/types";

/** All measurements are in SVG units on a 300 × 640 canvas, centred at x = 150. */
export const CX = 150;
export const VIEW_W = 300;
export const VIEW_H = 640;

export const Y = {
  head: 78,
  neckBottom: 128,
  shoulder: 136,
  chest: 172,
  waist: 252,
  hip: 302,
  crotch: 336,
  knee: 452,
  ankle: 570,
  foot: 590,
} as const;

interface Widths {
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  arm: number;
}

const SHAPES: Record<BodyShape, Widths> = {
  slim: { shoulder: 50, chest: 39, waist: 32, hip: 40, arm: 10 },
  regular: { shoulder: 57, chest: 45, waist: 39, hip: 45, arm: 11.5 },
  curvy: { shoulder: 53, chest: 47, waist: 35, hip: 55, arm: 11.5 },
  broad: { shoulder: 66, chest: 54, waist: 47, hip: 50, arm: 13.5 },
};

export interface Pt {
  x: number;
  y: number;
}

export interface Body {
  w: Widths;
  /** Half-width of the torso at height y. */
  half: (y: number) => number;
  /** Arm joints for one side (-1 = left of screen, 1 = right). */
  arm: (side: -1 | 1) => { shoulder: Pt; elbow: Pt; wrist: Pt; hand: Pt };
  /** Leg outline points for one side. */
  leg: (side: -1 | 1) => { hipOuter: Pt; kneeOuter: Pt; ankleOuter: Pt; ankleInner: Pt; kneeInner: Pt; crotch: Pt; ankleCenter: Pt; kneeCenter: Pt };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function bodyFor(shape: BodyShape): Body {
  const w = SHAPES[shape];
  const stops: [number, number][] = [
    [Y.shoulder, w.shoulder - 4],
    [Y.chest, w.chest],
    [Y.waist, w.waist],
    [Y.hip, w.hip],
    [Y.crotch, w.hip - 2],
  ];
  const half = (y: number) => {
    if (y <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      const [y1, v1] = stops[i];
      const [y0, v0] = stops[i - 1];
      if (y <= y1) {
        const t = (y - y0) / (y1 - y0);
        // ease for a softer silhouette
        const e = t * t * (3 - 2 * t);
        return lerp(v0, v1, e);
      }
    }
    return stops[stops.length - 1][1];
  };

  const arm = (side: -1 | 1) => {
    const shoulder = { x: CX + side * (w.shoulder - 3), y: Y.shoulder + 12 };
    const elbow = { x: CX + side * (half(Y.waist) + 18 + w.arm * 0.4), y: Y.waist - 8 };
    const wrist = { x: CX + side * (half(Y.hip) + 14 + w.arm * 0.3), y: Y.hip + 30 };
    const hand = { x: wrist.x + side * 1, y: wrist.y + 16 };
    return { shoulder, elbow, wrist, hand };
  };

  const leg = (side: -1 | 1) => {
    const ankleCenter = { x: CX + side * 22, y: Y.ankle };
    const kneeCenter = { x: CX + side * (w.hip * 0.42 + 6), y: Y.knee };
    return {
      hipOuter: { x: CX + side * w.hip, y: Y.hip },
      kneeOuter: { x: kneeCenter.x + side * 15, y: Y.knee },
      ankleOuter: { x: ankleCenter.x + side * 9, y: Y.ankle },
      ankleInner: { x: ankleCenter.x - side * 8, y: Y.ankle },
      kneeInner: { x: kneeCenter.x - side * 13, y: Y.knee },
      crotch: { x: CX + side * 1.5, y: Y.crotch },
      ankleCenter,
      kneeCenter,
    };
  };

  return { w, half, arm, leg };
}

/** Point along a straight segment. */
export function along(a: Pt, b: Pt, t: number): Pt {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export const p = (pt: Pt) => `${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;

/**
 * Closed torso outline from the shoulders down to `hemY`.
 * `off` widens it (layers on top need to be a little bigger).
 * `neck` controls the neckline: half-width at the top and depth.
 */
export function torsoPath(body: Body, hemY: number, off: number, neck: { w: number; depth: number }, hemFlare = 0): string {
  const top = Y.neckBottom + 2;
  const right: Pt[] = [];
  const left: Pt[] = [];
  for (let y = Y.shoulder + 8; y <= hemY; y += 8) {
    const t = (y - Y.shoulder) / Math.max(1, hemY - Y.shoulder);
    const h = body.half(y) + off + hemFlare * t * t;
    right.push({ x: CX + h, y });
    left.push({ x: CX - h, y });
  }
  const hemH = body.half(hemY) + off + hemFlare;
  right.push({ x: CX + hemH, y: hemY });
  left.push({ x: CX - hemH, y: hemY });

  const sh = body.w.shoulder + off - 2;
  let d = `M ${CX - neck.w} ${top}`;
  d += ` Q ${CX} ${top + neck.depth * 1.6} ${CX + neck.w} ${top}`;
  d += ` Q ${CX + sh - 6} ${top + 2} ${CX + sh} ${Y.shoulder + 8}`;
  for (const pt of right) d += ` L ${p(pt)}`;
  d += ` Q ${CX} ${hemY + 4} ${p(left[left.length - 1])}`;
  for (let i = left.length - 2; i >= 0; i--) d += ` L ${p(left[i])}`;
  d += ` Q ${CX - sh + 6} ${top + 2} ${CX - neck.w} ${top} Z`;
  return d;
}

/** Arm polyline from the shoulder to `t` along the arm (0..1, 1 = wrist). */
export function sleevePath(body: Body, side: -1 | 1, length: number): string {
  const a = body.arm(side);
  const start = { x: a.shoulder.x - side * 3, y: a.shoulder.y - 4 };
  if (length <= 0.5) {
    const end = along(start, a.elbow, length * 2);
    return `M ${p(start)} L ${p(end)}`;
  }
  const end = along(a.elbow, a.wrist, (length - 0.5) * 2);
  return `M ${p(start)} L ${p(a.elbow)} L ${p(end)}`;
}

/** Outline of both legs (or trouser legs) from the waist down to `hemY`. */
export function legsPath(body: Body, waistY: number, hemY: number, off: number, cuff = 0): string {
  const L = body.leg(-1);
  const R = body.leg(1);
  const lerpY = (a: Pt, b: Pt, y: number) => (y <= a.y ? a : y >= b.y ? b : along(a, b, (y - a.y) / (b.y - a.y)));
  const outerAt = (leg: typeof L, y: number, side: number) => {
    const pt = y <= Y.knee ? lerpY(leg.hipOuter, leg.kneeOuter, y) : lerpY(leg.kneeOuter, leg.ankleOuter, y);
    return { x: pt.x + side * off, y };
  };
  const innerAt = (leg: typeof L, y: number, side: number) => {
    const pt = y <= Y.knee ? lerpY(leg.crotch, leg.kneeInner, y) : lerpY(leg.kneeInner, leg.ankleInner, y);
    return { x: pt.x - side * off, y };
  };
  const wHalf = body.half(waistY) + off;
  const ys = [Y.hip, Y.knee].filter((y) => y < hemY);

  let d = `M ${CX - wHalf} ${waistY}`;
  d += ` L ${CX + wHalf} ${waistY}`;
  for (const y of ys) d += ` L ${p(outerAt(R, y, 1))}`;
  const rOutHem = outerAt(R, hemY, 1);
  const rInHem = innerAt(R, hemY, 1);
  d += ` L ${rOutHem.x - cuff} ${hemY} L ${rInHem.x + cuff} ${hemY}`;
  if (Y.knee < hemY) d += ` L ${p(innerAt(R, Y.knee, 1))}`;
  d += ` L ${CX} ${Y.crotch + 4}`;
  if (Y.knee < hemY) d += ` L ${p(innerAt(L, Y.knee, -1))}`;
  const lInHem = innerAt(L, hemY, -1);
  const lOutHem = outerAt(L, hemY, -1);
  d += ` L ${lInHem.x - cuff} ${hemY} L ${lOutHem.x + cuff} ${hemY}`;
  for (const y of [...ys].reverse()) d += ` L ${p(outerAt(L, y, -1))}`;
  d += " Z";
  return d;
}

/** A flared skirt from the waist to `hemY`. */
export function skirtPath(body: Body, waistY: number, hemY: number, flare: number): string {
  const top = body.half(waistY) + 2;
  const hip = body.half(Y.hip) + 4;
  const hem = hip + flare;
  return [
    `M ${CX - top} ${waistY}`,
    `L ${CX + top} ${waistY}`,
    `Q ${CX + hip + 2} ${Y.hip - 10} ${CX + hip} ${Math.min(Y.hip, hemY)}`,
    `L ${CX + hem} ${hemY}`,
    `Q ${CX} ${hemY + 10} ${CX - hem} ${hemY}`,
    `L ${CX - hip} ${Math.min(Y.hip, hemY)}`,
    `Q ${CX - hip - 2} ${Y.hip - 10} ${CX - top} ${waistY} Z`,
  ].join(" ");
}
