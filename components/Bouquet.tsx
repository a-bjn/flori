import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Buchet SVG, desenat procedural.                                     */
/*  Clasele (.stem .leaf .head .petal ...) sunt țintele animațiilor GSAP */
/*  din Experience.tsx                                                  */
/* ------------------------------------------------------------------ */

type Pt = { x: number; y: number };

const BASE: Pt = { x: 200, y: 478 };
const r1 = (n: number) => Math.round(n * 10) / 10;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(14022026);
const between = (a: number, b: number) => a + (b - a) * rnd();

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 + amt))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/* ------------------------- geometrie tulpină ------------------------ */

function makeStem(tip: Pt, curl = 0) {
  const p0 = BASE;
  const p1 = {
    x: BASE.x + (tip.x - BASE.x) * 0.08 + curl,
    y: BASE.y - (BASE.y - tip.y) * 0.5,
  };
  const p2 = {
    x: tip.x - (tip.x - BASE.x) * 0.3,
    y: tip.y + (BASE.y - tip.y) * 0.28,
  };
  const p3 = tip;
  const d = `M${p0.x} ${p0.y} C${r1(p1.x)} ${r1(p1.y)} ${r1(p2.x)} ${r1(p2.y)} ${p3.x} ${p3.y}`;

  const at = (t: number): Pt => {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  };
  const angleAt = (t: number) => {
    const u = 1 - t;
    const vx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const vy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    return (Math.atan2(vx, -vy) * 180) / Math.PI;
  };
  return { d, at, angleAt };
}

const STEM_COLORS = ["#4f8a5b", "#5e9a66", "#3f7650"];

/* ----------------------------- frunze ------------------------------- */

const LEAF = "M0 0 C-13 -9 -13 -32 0 -46 C13 -32 13 -9 0 0Z";
const ROUND_LEAF = "M0 0 C-13 -4 -13 -23 0 -27 C13 -23 13 -4 0 0Z";

function Leaf({
  x,
  y,
  angle,
  s,
  fill,
  round,
}: {
  x: number;
  y: number;
  angle: number;
  s: number;
  fill: string;
  round?: boolean;
}) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) rotate(${r1(angle)}) scale(${r1(s)})`}>
      <g className="leaf">
        <path d={round ? ROUND_LEAF : LEAF} fill={fill} stroke={shade(fill, -0.25)} strokeWidth={0.8} />
        {!round && <path d="M0 -3 L0 -36" stroke="#fff" strokeOpacity={0.22} strokeWidth={1} fill="none" />}
      </g>
    </g>
  );
}

/* ----------------------------- capete ------------------------------- */

const ROSE_PETAL = "M-9 0 C-34 -6 -36 -40 -14 -47 Q0 -51 14 -47 C36 -40 34 -6 9 0Z";

function RoseHead({ colors }: { colors: [string, string, string, string] }) {
  const layers = [
    { n: 5, off: 0, s: 1, c: colors[0] },
    { n: 5, off: 36, s: 0.8, c: colors[1] },
    { n: 5, off: 12, s: 0.58, c: colors[2] },
    { n: 3, off: 50, s: 0.36, c: colors[3] },
  ];
  const out: ReactNode[] = [];
  layers.forEach((l, li) => {
    for (let i = 0; i < l.n; i++) {
      const a = l.off + (360 / l.n) * i;
      out.push(
        <g key={`${li}-${i}`} transform={`rotate(${r1(a)}) scale(${l.s})`}>
          <g className="petal">
            <path d={ROSE_PETAL} fill={l.c} stroke={shade(l.c, -0.28)} strokeWidth={1} />
            <path d="M0 -8 Q-4 -28 0 -40" stroke="#fff" strokeOpacity={0.2} strokeWidth={1.4} fill="none" />
          </g>
        </g>,
      );
    }
  });
  return (
    <>
      <circle r={50} fill="transparent" />
      {out}
      <g className="petal">
        <path
          d="M-4 1 A4.5 4.5 0 1 1 4 -1 A7 7 0 0 1 -6 3"
          stroke={shade(colors[3], -0.35)}
          strokeWidth={1.4}
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </>
  );
}

const DAISY_PETAL = "M0 0 C-7 -6 -8 -30 0 -38 C8 -30 7 -6 0 0Z";

function DaisyHead() {
  const out: ReactNode[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    out.push(
      <g key={`o${i}`} transform={`rotate(${r1((360 / n) * i)})`}>
        <g className="petal">
          <path d={DAISY_PETAL} fill="#ffffff" stroke="#e4dcef" strokeWidth={0.8} />
        </g>
      </g>,
    );
  }
  for (let i = 0; i < n; i++) {
    out.push(
      <g key={`i${i}`} transform={`rotate(${r1((360 / n) * i + 360 / n / 2)}) scale(0.82)`}>
        <g className="petal">
          <path d={DAISY_PETAL} fill="#fbf7ff" stroke="#e4dcef" strokeWidth={0.8} />
        </g>
      </g>,
    );
  }
  return (
    <>
      <circle r={42} fill="transparent" />
      {out}
      <g className="petal">
        <circle r={9} fill="#ffc93c" stroke="#e69b00" strokeWidth={1.2} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle
            key={i}
            cx={r1(Math.cos((i * Math.PI) / 3) * 4.6)}
            cy={r1(Math.sin((i * Math.PI) / 3) * 4.6)}
            r={1}
            fill="#e69b00"
          />
        ))}
      </g>
    </>
  );
}

function TulipHead({ colors }: { colors: [string, string, string] }) {
  return (
    <>
      <circle cy={-34} r={40} fill="transparent" />
      <g className="petal">
        <path
          d="M0 2 C-30 0 -34 -42 -21 -64 C-11 -52 -4 -40 0 -34Z"
          fill={colors[0]}
          stroke={shade(colors[0], -0.25)}
          strokeWidth={1}
        />
      </g>
      <g className="petal">
        <path
          d="M0 2 C30 0 34 -42 21 -64 C11 -52 4 -40 0 -34Z"
          fill={colors[1]}
          stroke={shade(colors[1], -0.25)}
          strokeWidth={1}
        />
      </g>
      <g className="petal">
        <path
          d="M0 2 C-22 -4 -24 -44 0 -68 C24 -44 22 -4 0 2Z"
          fill={colors[2]}
          stroke={shade(colors[2], -0.22)}
          strokeWidth={1}
        />
        <path d="M0 -6 Q-5 -34 0 -58" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.6} fill="none" />
      </g>
    </>
  );
}

const BUD_COLORS = ["#9b7fd1", "#b79ae6", "#8566c4"];

function LavenderHead() {
  const out: ReactNode[] = [];
  const rows = 9;
  for (let i = 0; i < rows; i++) {
    const y = -8 - i * 9.5;
    const k = 1 - i * 0.055;
    ([-1, 1] as const).forEach((side) => {
      const c = BUD_COLORS[(i + (side === 1 ? 1 : 0)) % 3];
      out.push(
        <g key={`${i}${side}`} transform={`translate(${r1(side * 3.6 * k)} ${r1(y)}) rotate(${side * 26})`}>
          <g className="petal">
            <ellipse cy={-5} rx={3.4 * k} ry={6.6 * k} fill={c} stroke={shade(c, -0.25)} strokeWidth={0.6} />
          </g>
        </g>,
      );
    });
  }
  out.push(
    <g key="top" transform={`translate(0 ${-8 - rows * 9.5})`}>
      <g className="petal">
        <ellipse cy={-4} rx={2.6} ry={6} fill="#b79ae6" stroke="#7b5cc0" strokeWidth={0.6} />
      </g>
    </g>,
  );
  return <>{out}</>;
}

type Gyp = { dots: { x: number; y: number; r: number }[] };
function makeGyp(): Gyp {
  const dots = [];
  for (let i = 0; i < 11; i++) {
    const a = between(0, Math.PI * 2);
    const rad = between(8, 32);
    dots.push({ x: r1(Math.cos(a) * rad), y: r1(Math.sin(a) * rad * 0.85 - 6), r: r1(between(2.4, 4)) });
  }
  return { dots };
}

function GypHead({ gyp }: { gyp: Gyp }) {
  return (
    <>
      {gyp.dots.map((d, i) => (
        <path
          key={`t${i}`}
          className="twig"
          pathLength={1}
          d={`M0 0 L${d.x} ${d.y}`}
          stroke="#a9c9a4"
          strokeWidth={1.1}
          fill="none"
        />
      ))}
      {gyp.dots.map((d, i) => (
        <g key={`d${i}`} transform={`translate(${d.x} ${d.y})`}>
          <g className="petal">
            <circle r={d.r} fill="#ffffff" stroke="#efe6f5" strokeWidth={0.6} />
            <circle r={d.r * 0.38} fill="#ffe9a8" />
          </g>
        </g>
      ))}
    </>
  );
}

/* ------------------------- definiția buchetului ---------------------- */

type FlowerDef =
  | { kind: "green"; tip: Pt; curl?: number }
  | { kind: "lavender"; tip: Pt }
  | { kind: "gyp"; tip: Pt }
  | { kind: "daisy"; tip: Pt; s: number }
  | { kind: "tulip"; tip: Pt; colors: [string, string, string] }
  | { kind: "rose"; tip: Pt; s: number; colors: [string, string, string, string] };

// Ordinea = de la spate la față (și ordinea în care înfloresc).
const DEFS: FlowerDef[] = [
  { kind: "green", tip: { x: 40, y: 292 }, curl: -10 },
  { kind: "green", tip: { x: 360, y: 296 }, curl: 10 },
  { kind: "green", tip: { x: 62, y: 214 } },
  { kind: "green", tip: { x: 340, y: 216 } },
  { kind: "green", tip: { x: 132, y: 104 } },
  { kind: "green", tip: { x: 268, y: 100 } },
  { kind: "green", tip: { x: 96, y: 336 } },
  { kind: "green", tip: { x: 306, y: 338 } },

  { kind: "lavender", tip: { x: 100, y: 238 } },
  { kind: "lavender", tip: { x: 302, y: 236 } },
  { kind: "lavender", tip: { x: 200, y: 168 } },

  { kind: "gyp", tip: { x: 160, y: 140 } },
  { kind: "gyp", tip: { x: 246, y: 134 } },
  { kind: "gyp", tip: { x: 76, y: 176 } },
  { kind: "gyp", tip: { x: 330, y: 180 } },
  { kind: "gyp", tip: { x: 206, y: 100 } },

  { kind: "daisy", tip: { x: 150, y: 212 }, s: 0.95 },
  { kind: "daisy", tip: { x: 252, y: 206 }, s: 0.95 },
  { kind: "daisy", tip: { x: 58, y: 296 }, s: 0.8 },
  { kind: "daisy", tip: { x: 344, y: 294 }, s: 0.8 },

  { kind: "tulip", tip: { x: 118, y: 306 }, colors: ["#e0457b", "#ee5a8f", "#ff8fb1"] },
  { kind: "tulip", tip: { x: 284, y: 308 }, colors: ["#e8624c", "#f98062", "#ffb08f"] },

  { kind: "rose", tip: { x: 200, y: 266 }, s: 1.18, colors: ["#e63e68", "#c62a56", "#a31d47", "#7d1236"] },
  { kind: "rose", tip: { x: 134, y: 338 }, s: 0.95, colors: ["#ffc6d8", "#ff9fbc", "#f2708f", "#d44a6e"] },
  { kind: "rose", tip: { x: 268, y: 342 }, s: 0.95, colors: ["#ffbcae", "#ff948a", "#ee6c6c", "#c9444a"] },
  { kind: "rose", tip: { x: 200, y: 352 }, s: 0.82, colors: ["#fff6f0", "#ffe3e3", "#ffcdd3", "#f0a4b0"] },
];

type Built = {
  def: FlowerDef;
  d: string;
  stemColor: string;
  stemWidth: number;
  leaves: { x: number; y: number; angle: number; s: number; fill: string; round?: boolean }[];
  rot: number;
  gyp?: Gyp;
};

const LEAF_FILLS = ["#5f9d6b", "#4f8a5b", "#6aa876"];
const EUC_FILLS = ["#8fb9a0", "#a9cdb6", "#6fa188"];

function build(): Built[] {
  return DEFS.map((def, idx) => {
    const stem = makeStem(def.tip, def.kind === "green" ? def.curl ?? 0 : 0);
    const leaves: Built["leaves"] = [];

    if (def.kind === "green") {
      for (let t = 0.3, i = 0; t <= 0.98; t += 0.1, i++) {
        const p = stem.at(t);
        const a = stem.angleAt(t);
        const sc = 1.15 - t * 0.35;
        leaves.push({ x: p.x, y: p.y, angle: a - 52 - between(0, 14), s: sc, fill: EUC_FILLS[i % 3], round: true });
        leaves.push({ x: p.x, y: p.y, angle: a + 52 + between(0, 14), s: sc, fill: EUC_FILLS[(i + 1) % 3], round: true });
      }
      const tip = stem.at(1);
      leaves.push({ x: tip.x, y: tip.y, angle: stem.angleAt(1), s: 0.9, fill: EUC_FILLS[0], round: true });
    } else if (def.kind !== "gyp") {
      const big = def.kind === "tulip" ? 1.5 : def.kind === "lavender" ? 0.8 : 1;
      [0.42, 0.62].forEach((t, i) => {
        const p = stem.at(t);
        const a = stem.angleAt(t);
        leaves.push({
          x: p.x,
          y: p.y,
          angle: a + (i % 2 ? 1 : -1) * (48 + between(0, 14)),
          s: big * (0.85 + between(0, 0.3)),
          fill: LEAF_FILLS[(idx + i) % 3],
        });
      });
    }

    const tangent = stem.angleAt(1);
    const rot =
      def.kind === "tulip" || def.kind === "lavender"
        ? tangent
        : def.kind === "rose" || def.kind === "daisy"
          ? between(-25, 25)
          : between(-30, 30);

    return {
      def,
      d: stem.d,
      stemColor: STEM_COLORS[idx % 3],
      stemWidth: def.kind === "rose" ? 4.4 : def.kind === "green" ? 3 : 3.6,
      leaves,
      rot: r1(rot),
      gyp: def.kind === "gyp" ? makeGyp() : undefined,
    };
  });
}

const BUILT = build();

const SPARKLES: [number, number, number][] = [
  [48, 120, 1.1],
  [352, 132, 0.9],
  [112, 40, 0.8],
  [292, 52, 1.2],
  [200, 24, 1],
  [24, 230, 0.8],
  [378, 250, 0.9],
  [160, 74, 0.7],
  [250, 82, 0.8],
  [30, 360, 0.9],
  [372, 372, 1],
  [90, 150, 0.6],
  [316, 148, 0.7],
  [200, 150, 0.6],
  [150, 400, 0.7],
  [262, 396, 0.8],
];
const STAR = "M0 -10 Q1 -1 10 0 Q1 1 0 10 Q-1 1 -10 0 Q-1 -1 0 -10Z";

/* ----------------------------- componenta --------------------------- */

export default function Bouquet() {
  return (
    <svg
      className="bouquet"
      viewBox="0 0 400 600"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Un buchet de flori"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="paperOuter" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff6ec" />
          <stop offset="1" stopColor="#f1d3c8" />
        </linearGradient>
        <linearGradient id="paperInner" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffd0de" />
          <stop offset="1" stopColor="#ee8aae" />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe49a" />
          <stop offset="0.5" stopColor="#e8b44c" />
          <stop offset="1" stopColor="#b9801f" />
        </linearGradient>
      </defs>

      {/* tulpini + flori */}
      <g className="sway-all">
        {BUILT.map((b, i) => {
          const { def } = b;
          const isGreen = def.kind === "green";
          const common = (
            <>
              <path
                className="stem"
                pathLength={1}
                d={b.d}
                stroke={b.stemColor}
                strokeWidth={b.stemWidth}
                fill="none"
              />
              {b.leaves.map((l, k) => (
                <Leaf key={k} {...l} />
              ))}
            </>
          );

          if (isGreen) {
            return (
              <g key={i} className="greens">
                {common}
              </g>
            );
          }

          let head: ReactNode = null;
          let scale = 1;
          if (def.kind === "rose") {
            head = <RoseHead colors={def.colors} />;
            scale = def.s;
          } else if (def.kind === "daisy") {
            head = <DaisyHead />;
            scale = def.s;
          } else if (def.kind === "tulip") {
            head = <TulipHead colors={def.colors} />;
          } else if (def.kind === "lavender") {
            head = <LavenderHead />;
          } else if (def.kind === "gyp" && b.gyp) {
            head = <GypHead gyp={b.gyp} />;
          }

          return (
            <g key={i} className={`flower flower-${def.kind}`}>
              {common}
              <g transform={`translate(${def.tip.x} ${def.tip.y}) rotate(${b.rot}) scale(${scale})`}>
                <g className="sway">
                  <g className="wiggle">
                    <g className="head">{head}</g>
                  </g>
                </g>
              </g>
            </g>
          );
        })}
      </g>

      {/* hârtia de împachetat + fundița */}
      <g className="paper">
        <path
          d="M58 366 Q128 398 200 392 Q272 398 342 366 L234 588 Q200 600 166 588Z"
          fill="url(#paperOuter)"
          stroke="#e2bfb2"
          strokeWidth={1}
        />
        <path
          d="M86 384 Q146 414 200 408 Q254 414 314 384 L229 586 Q200 596 171 586Z"
          fill="url(#paperInner)"
        />
        <path d="M200 410 L188 580" stroke="#fff" strokeOpacity={0.28} strokeWidth={1.4} fill="none" />
        <path d="M148 398 L182 574" stroke="#a02f5c" strokeOpacity={0.18} strokeWidth={1.2} fill="none" />
        <path d="M254 398 L218 574" stroke="#a02f5c" strokeOpacity={0.18} strokeWidth={1.2} fill="none" />
        <path
          d="M86 384 Q146 414 200 408 Q254 414 314 384"
          stroke="#fff"
          strokeOpacity={0.75}
          strokeWidth={2}
          fill="none"
        />

        <g className="ribbon">
          <path
            className="ribbon-band"
            d="M113 466 Q200 490 287 466 L279 492 Q200 516 121 492Z"
            fill="url(#gold)"
            stroke="#b9801f"
            strokeWidth={0.8}
          />
          <path
            className="bow-tail"
            d="M196 498 L166 568 L183 559 L190 578 L205 502Z"
            fill="url(#gold)"
            stroke="#b9801f"
            strokeWidth={0.8}
          />
          <path
            className="bow-tail"
            d="M204 498 L234 568 L217 559 L210 578 L195 502Z"
            fill="url(#gold)"
            stroke="#b9801f"
            strokeWidth={0.8}
          />
          <g className="bow-loop bow-l">
            <path
              d="M200 492 C168 448 118 462 132 500 C140 520 180 506 200 492Z"
              fill="url(#gold)"
              stroke="#b9801f"
              strokeWidth={0.8}
            />
            <path d="M196 492 C170 470 146 476 146 497" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.4} fill="none" />
          </g>
          <g className="bow-loop bow-r">
            <path
              d="M200 492 C232 448 282 462 268 500 C260 520 220 506 200 492Z"
              fill="url(#gold)"
              stroke="#b9801f"
              strokeWidth={0.8}
            />
            <path d="M204 492 C230 470 254 476 254 497" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.4} fill="none" />
          </g>
          <ellipse className="knot" cx={200} cy={494} rx={12} ry={13} fill="url(#gold)" stroke="#b9801f" strokeWidth={0.8} />
        </g>
      </g>

      {/* sclipiri */}
      <g className="sparkles" style={{ pointerEvents: "none" }}>
        {SPARKLES.map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <path className="sparkle" d={STAR} fill="#fff6d6" />
          </g>
        ))}
      </g>
    </svg>
  );
}
