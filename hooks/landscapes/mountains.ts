// The mountains landscape: an Alpine range behind the meadow, whose snowline
// follows the seasons, and an ibex as the figure, climbing its rock as the
// context fills. Everything shared with the winter landscape (sky, fir trees,
// meadow, weather, occasions, label) stays in scene.ts.
//
// Weather per model reads naturally here: sunset becomes Alpenglühen on the
// snow, fog lies as a sea of fog between the peaks.

import { bonfire } from '../decor.js'
import type { Weather } from '../settings.js'

/** What the mountains need to know of the year (a subset of the scene's YearState). */
export type MountainYear = { snow: number; autumn: number; season: string; occasion?: string }

/** Costume pieces the scene draws; the ibex only places them. */
export type Wardrobe = {
  costume: { hat?: string; hand?: string; face?: string; body?: string }
  stage: { hat: boolean; scarf: boolean; broom: boolean }
  colors: { hat: string; pompom: string; scarf: string }
  hatSvg: (kind: string) => string
  handSvg: (kind: string, x: number, y: number) => string
  faceSvg: (kind: string, ex: number, ey: number) => string
  bodySvg: (kind: string, y: number) => string
  beanieSvg: (x: number, y: number, rot: number) => string
  marks: (mood: 'cheer' | 'fright' | undefined, top: number) => string
}

/** How high the ibex stands on its rock at full context, in landscape units. */
export const IBEX_CLIMB = 150
/** The ibex's height above its rock, horns included. */
export const IBEX_HEIGHT = 420

const PEAKS: [x: number, apex: number, half: number][] = [
  [150, 250, 260], [430, 190, 300], [720, 270, 260], [980, 165, 320], [1260, 225, 290], [1520, 280, 250],
]
const BASE = 640

function peak(x: number, apex: number, half: number, cls: string): string {
  const h = BASE - apex
  return `<path class="${cls}" d="M${x - half} ${BASE} L${(x - half * 0.45).toFixed(0)} ${(apex + h * 0.45).toFixed(0)} L${x - 10} ${apex + 14} L${x} ${apex} L${x + 14} ${apex + 20} L${(x + half * 0.5).toFixed(0)} ${(apex + h * 0.5).toFixed(0)} L${x + half} ${BASE} Z"/>`
}

/** The snow on a peak, down to a share of its height: more in winter, only the top in summer. */
function snowCap(x: number, apex: number, half: number, depth: number): string {
  const h = BASE - apex
  const yb = apex + h * depth
  const xl = x - half * depth
  const xr = x + half * depth
  return `<path class="mcap" d="M${x} ${apex} L${xl.toFixed(0)} ${yb.toFixed(0)} L${(xl + (x - xl) * 0.4).toFixed(0)} ${(yb - 14).toFixed(0)} L${x} ${(yb + 6).toFixed(0)} L${(xr - (xr - x) * 0.4).toFixed(0)} ${(yb - 12).toFixed(0)} L${xr.toFixed(0)} ${yb.toFixed(0)} Z"/>`
}

function cow(x: number, y: number, flip: boolean): string {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -0.42 : 0.42} 0.42)">
    <ellipse cx="0" cy="-48" rx="52" ry="28" fill="#ffffff"/><ellipse cx="-14" cy="-56" rx="16" ry="12" fill="#7a4a2a"/><ellipse cx="20" cy="-40" rx="12" ry="9" fill="#7a4a2a"/>
    <rect x="-40" y="-26" width="9" height="26" fill="#ffffff"/><rect x="28" y="-26" width="9" height="26" fill="#ffffff"/>
    <ellipse cx="60" cy="-62" rx="18" ry="14" fill="#ffffff"/><ellipse cx="72" cy="-56" rx="9" ry="7" fill="#f2b8a8"/><path d="M50 -74 L44 -84 M66 -74 L72 -84" stroke="#d8c8a8" stroke-width="4"/>
    <path d="M46 -50 L52 -38 L58 -50" fill="#e0a800"/></g>`
}

/** The range behind the meadow, with the snowline of the season and what the occasion adds up there. */
export function mountainRange(y: MountainYear, opts: { clicked: boolean }): string {
  const depth = 0.18 + 0.6 * Math.min(1, Math.max(0, y.snow))
  let out = ''
  // A paler range far behind, then the main peaks.
  for (const [x, apex, half] of PEAKS) out += peak(x + 130, apex + 60, half * 0.8, 'rock2') + snowCap(x + 130, apex + 60, half * 0.8, depth)
  for (const [x, apex, half] of PEAKS) out += peak(x, apex, half, 'rock') + snowCap(x, apex, half, depth)
  // A chalet on the foothills, with a lit window by night.
  const roof = y.snow > 0.4 ? 'roofsnow' : 'roof'
  out += `<g transform="translate(560 612)"><rect x="-26" y="-30" width="52" height="30" class="chalet"/><path d="M-34 -28 L0 -52 L34 -28 Z" class="${roof}"/><rect x="-8" y="-20" width="12" height="10" class="win"/></g>`
  // Swiss National Day: bonfires on the summits.
  if (y.occasion === 'swissNationalDay') {
    out += bonfire(430, 196, 1) + bonfire(980, 171, 1) + bonfire(1260, 231, 1)
  }
  if (opts.clicked) {
    // An eagle glides across; with snow on the slopes a little snow slide puffs up.
    out += `<g class="eagle"><path d="M-26 0 Q-12 -12 0 0 Q12 -12 26 0 L18 2 Q8 -4 0 4 Q-8 -4 -18 2 Z" class="eaglebody"/></g>`
    if (y.snow > 0.3) out += `<g transform="translate(1000 260)"><circle r="26" class="puff"/><circle cx="30" cy="14" r="20" class="puff"/></g>`
  }
  return out
}

/** On the meadow, in front of the hills: cows with bells on the alp in spring and summer. */
export function mountainMeadow(y: MountainYear): string {
  return y.snow < 0.05 && (y.season === 'summer' || y.season === 'spring') ? cow(640, 762, false) + cow(770, 772, true) + cow(900, 760, false) : ''
}

/** Colours of the mountains in light and dark, with Alpenglühen for the sunset weather. */
export function mountainStyle(weather: Weather): string {
  const glow = weather === 'sunset'
  return `
  .rock { fill: ${glow ? '#9a8c97' : '#8b97a6'}; } .rock2 { fill: ${glow ? '#b9a5ad' : '#b3bdc9'}; }
  .mcap { fill: ${glow ? '#ffd2bd' : '#ffffff'}; }
  .crag { fill: #8a8f96; } .crag2 { fill: #a3a8ae; }
  .fur { fill: #8b6f4e; } .fur2 { fill: #c9b08a; } .furdark { fill: #5e4a34; }
  .horn { stroke: #6e5b3f; } .hornline { stroke: #4d3f2a; } .hoof { fill: #3a2f25; }
  .chalet { fill: #8a5a2b; } .roof { fill: #5a3a1e; } .roofsnow { fill: #ffffff; } .win { fill: #6b4a2f; }
  .eaglebody { fill: #3a2f25; } .eagle { animation: eagle 7s ease-in-out 1 both; }
  .puff { fill: #ffffff; opacity: 0; animation: puff 3s ease-out 1 both; }
  @keyframes eagle { from { transform: translate(-120px, 200px); } to { transform: translate(1720px, 60px); } }
  @keyframes puff { 0% { opacity: 0.9; transform: scale(0.4); } 100% { opacity: 0; transform: scale(1.8); } }
  @media (prefers-color-scheme: dark) {
    .rock { fill: ${glow ? '#5a4a5a' : '#3b4556'}; } .rock2 { fill: ${glow ? '#4a3d4c' : '#2f3848'}; }
    .mcap { fill: ${glow ? '#e8a8ad' : '#dfe8f2'}; }
    .crag { fill: #5a6170; } .crag2 { fill: #6b7282; }
    .fur { fill: #7a6246; } .fur2 { fill: #b09770; }
    .win { fill: #ffd66b; }
    .eaglebody { fill: #c9d8e8; }
  }`
}

/** The ibex on its rock: it climbs higher as the context fills. Drawn with its feet at y 0. */
export function ibex(percent: number, mood: 'cheer' | 'fright' | undefined, w: Wardrobe): string {
  const climb = Math.round((Math.min(100, Math.max(0, percent)) / 100) * IBEX_CLIMB)
  const rock =
    climb > 8
      ? `<path class="crag" d="M-180 0 L-150 ${-climb * 0.55} L-115 ${-climb} L165 ${-climb} L190 ${-climb * 0.5} L215 0 Z"/>
         <path class="crag2" d="M-115 ${-climb} L165 ${-climb} L150 ${-climb + 12} L-100 ${-climb + 12} Z"/>
         <path d="M-60 ${-climb * 0.4} L-20 ${-climb * 0.55} M60 ${-climb * 0.3} L110 ${-climb * 0.45}" stroke="#00000033" stroke-width="3"/>`
      : `<ellipse cx="-90" cy="-6" rx="34" ry="12" class="crag"/><ellipse cx="150" cy="-5" rx="26" ry="10" class="crag"/>`
  const eye =
    mood === 'cheer'
      ? `<path d="M112 -272 Q118 -280 124 -272" stroke="#1f1a14" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      : mood === 'fright'
        ? `<circle cx="118" cy="-272" r="8" fill="#ffffff" stroke="#1f1a14" stroke-width="2"/><circle cx="119" cy="-272" r="3" fill="#1f1a14"/>`
        : `<circle cx="118" cy="-271" r="4.5" fill="#1f1a14"/>`
  let body = `<ellipse cx="0" cy="0" rx="130" ry="14" fill="#000000" opacity="0.1"/>
    <rect x="-66" y="-120" width="15" height="118" class="fur"/><rect x="-42" y="-118" width="15" height="116" class="furdark"/>
    <rect x="48" y="-120" width="15" height="118" class="fur"/><rect x="72" y="-118" width="15" height="116" class="furdark"/>
    <rect x="-67" y="-10" width="17" height="10" class="hoof"/><rect x="-43" y="-10" width="17" height="10" class="hoof"/><rect x="47" y="-10" width="17" height="10" class="hoof"/><rect x="71" y="-10" width="17" height="10" class="hoof"/>
    <path d="M-104 -176 Q-122 -186 -116 -160 Z" class="furdark"/>
    <ellipse cx="0" cy="-150" rx="108" ry="58" class="fur"/><ellipse cx="6" cy="-122" rx="82" ry="26" class="fur2"/>
    <path d="M52 -192 L84 -262 L124 -248 L98 -172 Z" class="fur"/>
    <path class="horn" d="M100 -282 C 84 -342 34 -386 -10 -366" stroke-width="18" fill="none" stroke-linecap="round" opacity="0.75"/>
    <path class="horn" d="M110 -284 C 98 -350 48 -396 0 -380" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path class="hornline" d="M110 -284 C 98 -350 48 -396 0 -380" stroke-width="20" fill="none" stroke-dasharray="3 11"/>
    <ellipse cx="120" cy="-262" rx="36" ry="22" class="fur" transform="rotate(22 120 -262)"/>
    <ellipse cx="146" cy="-248" rx="13" ry="10" class="furdark"/>
    <path d="M96 -282 L84 -298 L104 -288 Z" class="furdark"/>
    ${w.costume.face === 'beard' ? '' : '<path d="M136 -240 Q140 -222 132 -212 Q128 -226 126 -238 Z" class="furdark"/>'}
    ${eye}`
  if (w.stage.scarf) {
    body += `<path d="M58 -206 Q90 -196 112 -226 L118 -212 Q92 -180 54 -192 Z" fill="${w.colors.scarf}"/><path d="M70 -198 L60 -150 L78 -150 L82 -196 Z" fill="${w.colors.scarf}" opacity="0.85"/>`
  }
  if (w.stage.broom) {
    // A mountaineer's backpack with a coiled rope.
    body += `<rect x="-46" y="-238" width="70" height="56" rx="12" fill="#c0392b"/><rect x="-36" y="-226" width="50" height="16" rx="6" fill="#9b2c22"/>
      <circle cx="-10" cy="-248" r="16" fill="none" stroke="#d9b44a" stroke-width="6"/><circle cx="-10" cy="-248" r="8" fill="none" stroke="#d9b44a" stroke-width="4"/>`
  }
  if (w.costume.face !== undefined) body += `<g transform="translate(117 0)">${w.faceSvg(w.costume.face, 9, -272)}</g>`
  if (w.costume.body !== undefined) body += `<g transform="translate(118 -226) scale(0.6)">${w.bodySvg(w.costume.body, 0)}</g>`
  if (w.costume.hand !== undefined) body += w.handSvg(w.costume.hand, 152, -244)
  const hatClass = mood === 'fright' ? 'hatpop' : ''
  if (w.costume.hat !== undefined) {
    body += `<g class="${hatClass}"><g transform="translate(112 -290) rotate(16) scale(0.6)">${w.hatSvg(w.costume.hat)}</g></g>`
  } else if (w.stage.hat) {
    body += `<g class="${hatClass}"><g transform="translate(112 -286) rotate(16) scale(0.62)">${w.beanieSvg(0, 0, 0)}</g></g>`
  }
  body += `<g transform="translate(60 0)">${w.marks(mood, -440)}</g>`
  return `${rock}<g transform="translate(0 ${-climb})">${body}</g>`
}
