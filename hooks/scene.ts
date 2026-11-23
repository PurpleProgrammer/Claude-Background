import { EINSTELLUNGEN, type Wetter } from './einstellungen.js'

const CFG = EINSTELLUNGEN

export type Anlass = 'ostern' | 'nationalfeiertag' | 'advent' | 'weihnachten' | 'silvester' | 'neujahr'

export type Datum = { y: number; m: number; d: number }

export type SceneInput = {
  percent: number
  modelLabel: string
  weather: Wetter
  date: Datum
  /** Set while a click effect plays: where the click landed (0 to 1). */
  click?: { x: number; y: number; seq: number }
}

// ── small helpers ─────────────────────────────────────────────────────────

const clamp = (v: number, lo = 0, hi = 1): number => Math.max(lo, Math.min(hi, v))

function seeded(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mix(a: string, b: string, t: number): string {
  const x = hex(a)
  const y = hex(b)
  const k = clamp(t)
  const out = x.map((v, i) => Math.round(v + ((y[i] ?? 0) - v) * k))
  return '#' + out.map(v => v.toString(16).padStart(2, '0')).join('')
}

function dayNumber(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

/** 0 before `from`, 1 after `to`, in between a straight ramp. Dates as [month, day] in year y. */
function ramp(date: Datum, from: [number, number], to: [number, number]): number {
  const now = dayNumber(date.y, date.m, date.d)
  const a = dayNumber(date.y, from[0], from[1])
  const b = dayNumber(date.y, to[0], to[1])
  if (b <= a) {
    return now >= b ? 1 : 0
  }
  return clamp((now - a) / (b - a))
}

export function easterSunday(y: number): Datum {
  const a = y % 19
  const b = Math.floor(y / 100)
  const c = y % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { y, m: month, d: day }
}

// ── the year: seasons and occasions ───────────────────────────────────────

export type Jahreslauf = {
  /** Snow on the ground, 0 to 1. */
  snow: number
  /** Autumn colours, 0 to 1. */
  autumn: number
  /** Snowman built, 0 to 1 (balls appear one by one). */
  build: number
  /** Snowman melted, 0 to 1. */
  melt: number
  figure: 'schneemann' | 'reste' | 'vogelscheuche'
  season: string
  anlass?: Anlass
  /** Weights of the falling things: snow, petals, fluff, leaves. */
  fall: { snow: number; petal: number; fluff: number; leaf: number }
}

export function jahreslauf(date: Datum): Jahreslauf {
  const k = CFG.kalender
  const { m } = date
  const snowIn = ramp(date, k.schneeBeginnt, k.schneeKomplett)
  const snowOut = ramp(date, k.schmelzeBeginn, k.schmelzeEnde)
  const inLateYear = m >= 9
  const snow = inLateYear ? snowIn : 1 - snowOut
  const build = inLateYear ? ramp(date, k.schneemannBauBeginn, k.schneemannBauEnde) : 1
  const melt = inLateYear ? 0 : snowOut

  // Leaves turn from September to mid October and stay until the snow covers them.
  const autumn = inLateYear ? ramp(date, [9, 1], [10, 15]) : 0

  let figure: Jahreslauf['figure']
  if (inLateYear && build > 0) {
    figure = 'schneemann'
  } else if (!inLateYear && melt < 1) {
    figure = 'schneemann'
  } else if (m >= 4 && m <= 5) {
    figure = 'reste'
  } else {
    figure = 'vogelscheuche'
  }

  let season: string
  if (snow >= 0.99) {
    season = 'Winter'
  } else if (!inLateYear && melt > 0 && melt < 1) {
    season = 'Tauwetter'
  } else if (inLateYear && snow > 0) {
    season = 'Erster Schnee'
  } else if (m >= 3 && m <= 5) {
    season = 'Frühling'
  } else if (m >= 6 && m <= 8) {
    season = 'Sommer'
  } else {
    season = 'Herbst'
  }

  const fall = {
    snow: snow,
    petal: m >= 3 && m <= 5 ? 1 - snow : 0,
    fluff: m >= 6 && m <= 8 ? 1 : 0,
    leaf: inLateYear ? autumn * (1 - snow) : 0,
  }
  if (fall.snow + fall.petal + fall.fluff + fall.leaf < 0.01) {
    fall.fluff = 1
  }

  return { snow, autumn, build, melt, figure, season, anlass: anlassAm(date), fall }
}

export function anlassAm(date: Datum): Anlass | undefined {
  const on = CFG.anlaesse
  const { y, m, d } = date
  const today = dayNumber(y, m, d)
  const e = easterSunday(y)
  const easter = dayNumber(e.y, e.m, e.d)
  if (on.ostern && today >= easter - 2 && today <= easter + 1) {
    return 'ostern'
  }
  if (on.nationalfeiertag && ((m === 7 && d === 31) || (m === 8 && d === 1))) {
    return 'nationalfeiertag'
  }
  if (on.silvester && m === 12 && d === 31) {
    return 'silvester'
  }
  if (on.silvester && m === 1 && d === 1) {
    return 'neujahr'
  }
  if (on.weihnachten && m === 12 && d >= 24 && d <= 26) {
    return 'weihnachten'
  }
  if (on.advent && m === 12 && d < 24) {
    return 'advent'
  }
  return undefined
}

export const ANLASS_NAME: Record<Anlass, string> = {
  ostern: 'Ostern',
  nationalfeiertag: '1. August',
  advent: 'Advent',
  weihnachten: 'Weihnachten',
  silvester: 'Silvester',
  neujahr: 'Neujahr',
}

// ── colours ───────────────────────────────────────────────────────────────

type Ground = { far: string; near: string; ground: string }

const GROUND = {
  light: {
    snow: { far: '#dde9f3', near: '#f7fbff', ground: '#ffffff' },
    green: { far: '#a7cf8f', near: '#8cc172', ground: '#7bb562' },
    autumn: { far: '#cdb27a', near: '#bd9659', ground: '#a98046' },
  },
  dark: {
    snow: { far: '#3a5272', near: '#6f88a8', ground: '#9db3cc' },
    green: { far: '#24402f', near: '#2f5238', ground: '#376043' },
    autumn: { far: '#4a3b26', near: '#5a4429', ground: '#66492b' },
  },
}

function ground(mode: 'light' | 'dark', y: Jahreslauf): Ground {
  const g = GROUND[mode]
  const base = (k: keyof Ground): string => mix(mix(g.green[k], g.autumn[k], y.autumn), g.snow[k], y.snow)
  return { far: base('far'), near: base('near'), ground: base('ground') }
}

const SKY: Record<Wetter, { light: [string, string, string]; dark: [string, string, string] }> = {
  klar: { light: ['#9fc6e8', '#c7def1', '#eef5fb'], dark: ['#070f1c', '#13233c', '#23395a'] },
  abendrot: { light: ['#6f82bd', '#f0a384', '#fbd9a8'], dark: ['#140b26', '#3a1f48', '#6a3558'] },
  nebel: { light: ['#bfc8d1', '#d6dde3', '#e9edf0'], dark: ['#171c23', '#262e38', '#3a444f'] },
}

// ── pieces of the scene ───────────────────────────────────────────────────

function particles(y: Jahreslauf, percent: number, rand: () => number): string {
  const p = clamp(percent / 100)
  const count = Math.round(CFG.flocken.minimum + p * (CFG.flocken.maximum - CFG.flocken.minimum))
  const baseFall = 22 - p * 10
  const w = y.fall
  const total = w.snow + w.petal + w.fluff + w.leaf
  let out = ''
  for (let i = 0; i < count; i++) {
    const x = Math.round(rand() * 1600)
    const yy = Math.round(rand() * 1000)
    const pick = rand() * total
    const lane = i % 3
    const dur = baseFall * (0.7 + rand() * 0.6)
    const delay = -rand() * dur
    if (pick < w.snow) {
      const r = (1.2 + rand() * 2.6).toFixed(1)
      const op = (0.55 + rand() * 0.45).toFixed(2)
      out += `<circle class="f s f${lane}" cx="${x}" cy="${yy}" r="${r}" opacity="${op}" style="animation-duration:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"/>`
    } else if (pick < w.snow + w.petal) {
      const c = ['#f7b6c8', '#fbd3df', '#ffffff', '#f49ab5'][i % 4] ?? '#f7b6c8'
      out += `<g transform="translate(${x} ${yy})"><ellipse class="f l${lane}" rx="4.5" ry="2.6" fill="${c}" style="animation-duration:${(dur * 1.3).toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"/></g>`
    } else if (pick < w.snow + w.petal + w.fluff) {
      out += `<circle class="f f${lane} fluff" cx="${x}" cy="${yy}" r="2.2" style="animation-duration:${(dur * 1.6).toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"/>`
    } else {
      const c = ['#d35400', '#e67e22', '#b03a2e', '#a0522d', '#d4a017'][i % 5] ?? '#d35400'
      out += `<g transform="translate(${x} ${yy})"><path class="f l${lane}" d="M0 -7 C 6 -4 6 4 0 7 C -6 4 -6 -4 0 -7 Z" fill="${c}" style="animation-duration:${(dur * 1.2).toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"/></g>`
    }
  }
  return out
}

function gust(y: Jahreslauf, click: { x: number; y: number }, rand: () => number): string {
  const cx = Math.round(click.x * 1600)
  const cy = Math.round(click.y * 1000)
  let out = ''
  for (let i = 0; i < 60; i++) {
    const x = cx + Math.round((rand() - 0.5) * 260)
    const yy = cy + Math.round((rand() - 0.5) * 200)
    const v = i % 4
    const delay = (rand() * 0.6).toFixed(2)
    const leafy = y.fall.leaf > y.fall.snow && y.fall.leaf >= y.fall.petal
    const petal = y.fall.petal > y.fall.snow && !leafy
    const shape = leafy
      ? `<path d="M0 -6 C 5 -3 5 3 0 6 C -5 3 -5 -3 0 -6 Z" fill="${['#d35400', '#e67e22', '#b03a2e'][i % 3] ?? '#d35400'}"/>`
      : petal
        ? `<ellipse rx="4" ry="2.4" fill="#f7b6c8"/>`
        : `<circle r="${(1.5 + rand() * 2.5).toFixed(1)}" class="gs"/>`
    out += `<g transform="translate(${x} ${yy})"><g class="g g${v}" style="animation-delay:${delay}s">${shape}</g></g>`
  }
  return out
}

function stars(rand: () => number): string {
  let out = ''
  for (let i = 0; i < 70; i++) {
    const x = Math.round(rand() * 1600)
    const y = Math.round(rand() * 480)
    const r = (0.6 + rand() * 1.4).toFixed(1)
    out += `<circle cx="${x}" cy="${y}" r="${r}"/>`
  }
  return `<g class="stars">${out}</g>`
}

function celestial(clicked: boolean): string {
  const face = clicked
    ? `<g class="face">
        <circle cx="-15" cy="-10" r="5" class="eye"/><circle cx="15" cy="-10" r="5" class="eye"/>
        <path d="M-20 10 Q0 30 20 10" class="smile"/>
        <circle cx="-27" cy="8" r="6" class="cheek"/><circle cx="27" cy="8" r="6" class="cheek"/>
      </g>`
    : ''
  return `<g transform="translate(1330 170)">
    <g class="sun"><circle r="58" class="halo"/><circle r="44" class="disc"/>${face}</g>
    <g class="moon"><circle r="46" class="disc"/><circle cx="-14" cy="12" r="7" class="crater"/><circle cx="16" cy="-14" r="5" class="crater"/>${face}</g>
  </g>`
}

function pines(y: Jahreslauf, anlass: Anlass | undefined, clicked: boolean, rand: () => number): string {
  const n = Math.max(0, Math.min(8, Math.round(CFG.anzahlTannen)))
  let out = ''
  let tallest = { x: 0, top: 9999 }
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1)
    const x = Math.round(1130 + t * 420 + (rand() - 0.5) * 30)
    const h = Math.round(150 + rand() * 90 + (i === Math.floor(n / 2) ? 50 : 0))
    const base = 640 + Math.round(rand() * 25)
    const top = base - h
    const wdt = h * 0.42
    const shade = i % 2 === 0 ? 'pine' : 'pine2'
    if (top < tallest.top) {
      tallest = { x, top }
    }
    const tiers = [0, 1, 2]
      .map(k => {
        const tt = top + k * h * 0.22
        const bb = top + h * (0.45 + k * 0.27)
        const half = wdt * (0.45 + k * 0.28)
        return `<path class="${shade}" d="M${x - half} ${bb} L${x} ${tt} L${x + half} ${bb} Z"/>`
      })
      .join('')
    const caps =
      y.snow > 0.05
        ? `<path class="cap" opacity="${y.snow.toFixed(2)}" d="M${x - wdt * 0.13} ${top + h * 0.12} L${x} ${top} L${x + wdt * 0.13} ${top + h * 0.12} Z M${x - wdt * 0.5} ${top + h * 0.6} Q${x} ${top + h * 0.5} ${x + wdt * 0.5} ${top + h * 0.6} L${x + wdt * 0.42} ${top + h * 0.56} Q${x} ${top + h * 0.47} ${x - wdt * 0.42} ${top + h * 0.56} Z"/>`
        : ''
    const trunk = `<rect class="trunk" x="${x - 7}" y="${base - 4}" width="14" height="26"/>`
    let drop = ''
    if (clicked && y.snow > 0.3) {
      for (let k = 0; k < 5; k++) {
        const dx = Math.round((rand() - 0.5) * wdt * 1.1)
        const dy = Math.round(top + h * (0.3 + rand() * 0.5))
        drop += `<g transform="translate(${x + dx} ${dy})"><g class="drop" style="animation-delay:${(rand() * 0.4).toFixed(2)}s"><circle r="${(4 + rand() * 4).toFixed(1)}" class="clump"/><circle cx="6" cy="3" r="3" class="clump"/></g></g>`
      }
    }
    if (clicked && y.snow <= 0.3 && i === Math.floor(n / 2)) {
      for (let k = 0; k < 3; k++) {
        drop += `<g transform="translate(${x + (k - 1) * 18} ${top + 40 + k * 12})"><g class="bird" style="animation-delay:${(k * 0.25).toFixed(2)}s"><path d="M-9 0 Q-4 -6 0 0 Q4 -6 9 0" class="wing"/></g></g>`
      }
    }
    out += `<g class="tree${clicked ? ' shake' : ''}">${tiers}${caps}</g>${trunk}${drop}`
  }

  // Lights and star on the tallest tree.
  if (n > 0 && (anlass === 'advent' || anlass === 'weihnachten')) {
    const colors = ['#ffd54a', '#ff6b6b', '#6bc5ff', '#8cff8c']
    let lights = ''
    for (let k = 0; k < 14; k++) {
      const row = Math.floor(k / 4)
      const lx = tallest.x + Math.round((((k % 4) - 1.5) / 1.5) * (14 + row * 18))
      const ly = tallest.top + 40 + row * 38 + (k % 2) * 6
      lights += `<circle cx="${lx}" cy="${ly}" r="4.5" fill="${colors[k % 4] ?? '#ffd54a'}" class="bulb" style="animation-delay:${((k % 5) * 0.6).toFixed(1)}s"/>`
    }
    out += lights
    if (anlass === 'weihnachten') {
      out += `<path class="xstar" d="${starPath(tallest.x, tallest.top - 6, 16, 7)}"/>`
    }
  }
  return out
}

function starPath(cx: number, cy: number, r1: number, r2: number): string {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? r1 : r2
    const a = (Math.PI / 5) * i - Math.PI / 2
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)} `
  }
  return d + 'Z'
}

function stage(percent: number): { muetze: boolean; schal: boolean; besen: boolean } {
  return {
    muetze: percent >= CFG.stufen.muetze,
    schal: percent >= CFG.stufen.schal,
    besen: percent >= CFG.stufen.besen,
  }
}

function beanie(cx: number, cy: number, rot = 0): string {
  const c = CFG.farben
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})">
    <path d="M-44 0 Q-46 -58 0 -62 Q46 -58 44 0 Z" fill="${c.muetze}"/>
    <rect x="-48" y="-12" width="96" height="18" rx="8" fill="${mix(c.muetze, '#000000', 0.25)}"/>
    <circle cx="0" cy="-66" r="14" fill="${c.bommel}"/>
  </g>`
}

function scarf(cy: number): string {
  const c = CFG.farben.schal
  const dark = mix(c, '#000000', 0.2)
  return `<path d="M-52 ${cy} Q0 ${cy + 22} 52 ${cy} L56 ${cy + 16} Q0 ${cy + 40} -56 ${cy + 16} Z" fill="${c}"/>
    <path d="M26 ${cy + 14} L44 ${cy + 78} L24 ${cy + 80} L12 ${cy + 18} Z" fill="${dark}"/>
    <path d="M28 ${cy + 76} l3 10 M35 ${cy + 75} l3 10 M42 ${cy + 74} l3 10" stroke="${dark}" stroke-width="3"/>`
}

function broom(x: number, top: number, bottom: number): string {
  const c = CFG.farben
  return `<path d="M${x} ${top} L${x + 6} ${bottom - 60}" stroke="${c.besenstiel}" stroke-width="8" stroke-linecap="round"/>
    <path d="M${x - 22} ${bottom} L${x - 4} ${bottom - 64} L${x + 16} ${bottom - 64} L${x + 36} ${bottom} Z" fill="${c.besenreisig}"/>
    <path d="M${x - 2} ${bottom - 52} L${x + 14} ${bottom - 52}" stroke="${mix(c.besenreisig, '#000000', 0.35)}" stroke-width="4"/>`
}

function snowman(y: Jahreslauf, percent: number): string {
  const s = stage(percent)
  const b = y.build
  const m = y.melt
  const done = b >= 1
  const sx = (1 + 0.35 * m).toFixed(3)
  const sy = (1 - 0.78 * m).toFixed(3)
  const ball = (cy: number, r: number): string =>
    `<circle cx="0" cy="${cy}" r="${r}" class="snowball"/>`
  let body = ''
  if (b > 0) body += ball(-90, 95)
  if (b > 0.4) body += ball(-225, 68)
  if (b > 0.75) body += ball(-330, 48)
  let face = ''
  if (done) {
    face = `<circle cx="0" cy="-245" r="7" class="coal"/><circle cx="0" cy="-215" r="7" class="coal"/><circle cx="0" cy="-185" r="7" class="coal"/>
      <circle cx="-16" cy="-342" r="6" class="coal"/><circle cx="16" cy="-342" r="6" class="coal"/>
      <path d="M0 -330 L44 -322 L0 -318 Z" fill="#e67e22"/>
      <path d="M-20 -310 Q0 -298 20 -310" stroke="#2b2b2b" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M-62 -230 L-150 -290 M-120 -270 L-140 -300 M-120 -270 L-155 -265" class="stick"/>
      <path d="M62 -230 L150 -280 M120 -262 L140 -292 M120 -262 L156 -262" class="stick"/>`
    if (s.schal) face += scarf(-285)
    if (s.besen) {
      face += broom(158, -330, 10)
      face += `<circle cx="-150" cy="-290" r="13" fill="${CFG.farben.faeustlinge}"/><circle cx="152" cy="-282" r="13" fill="${CFG.farben.faeustlinge}"/>`
    }
    if (s.muetze) face += beanie(0, -366, m * 25)
  }
  const puddle = m > 0 ? `<ellipse cx="0" cy="4" rx="${Math.round(110 + 120 * m)}" ry="${Math.round(10 + 14 * m)}" class="puddle"/>` : ''
  return `${puddle}<ellipse cx="0" cy="0" rx="120" ry="16" fill="#000000" opacity="0.08"/>
    <g transform="scale(${sx} ${sy})">${body}${face}</g>`
}

function remains(percent: number): string {
  const s = stage(percent)
  let out = `<ellipse cx="0" cy="2" rx="150" ry="18" class="puddle"/>
    <path d="M-40 -6 L10 -2 L-40 2 Z" fill="#e67e22"/>
    <circle cx="40" cy="-4" r="6" class="coal"/><circle cx="60" cy="0" r="6" class="coal"/><circle cx="-80" cy="-2" r="6" class="coal"/>
    <path d="M-150 -4 L-90 -20 M100 -2 L160 -24 M140 -16 L150 -34" class="stick"/>`
  if (s.muetze) out += beanie(-110, -6, -70)
  if (s.schal) out += `<path d="M20 -8 Q70 -26 130 -8 L126 4 Q70 -12 24 4 Z" fill="${CFG.farben.schal}"/>`
  if (s.besen) out += `<g transform="rotate(-80 180 0)">${broom(180, -200, 0)}</g>`
  return out + flowers()
}

function flowers(): string {
  const spots: [number, number, string][] = [
    [-170, -6, '#ffd54a'], [-125, 6, '#ffffff'], [-60, 10, '#f49ab5'], [70, 12, '#ffd54a'], [125, 4, '#b48cff'], [175, 10, '#ffffff'],
  ]
  return spots
    .map(([x, y, c]) => `<path d="M${x} ${y} L${x} ${y - 22}" stroke="#3f7d3a" stroke-width="3"/>
      <circle cx="${x - 5}" cy="${y - 24}" r="5" fill="${c}"/><circle cx="${x + 5}" cy="${y - 24}" r="5" fill="${c}"/><circle cx="${x}" cy="${y - 30}" r="5" fill="${c}"/><circle cx="${x}" cy="${y - 19}" r="5" fill="${c}"/>
      <circle cx="${x}" cy="${y - 24}" r="3.5" fill="#e0a800"/>`)
    .join('')
}

function scarecrow(percent: number): string {
  const s = stage(percent)
  let out = `<ellipse cx="0" cy="0" rx="110" ry="14" fill="#000000" opacity="0.08"/>
    <rect x="-7" y="-380" width="14" height="384" fill="#7a5230"/>
    <rect x="-150" y="-290" width="300" height="12" fill="#7a5230"/>
    <path d="M-120 -296 L120 -296 L80 -150 L-80 -150 Z" fill="#4a78a8"/>
    <path d="M-120 -296 L-80 -150 M-60 -296 L-40 -150 M0 -296 L0 -150 M60 -296 L40 -150 M120 -296 L80 -150 M-110 -260 L110 -260 M-100 -220 L100 -220 M-90 -185 L90 -185" stroke="#2f5a85" stroke-width="3"/>
    <path d="M-152 -292 l-18 -10 M-152 -284 l-20 4 M-152 -288 l-16 14 M152 -292 l18 -10 M152 -284 l20 4 M152 -288 l16 14" stroke="#d9b44a" stroke-width="4" stroke-linecap="round"/>
    <circle cx="0" cy="-340" r="46" fill="#d8b98a"/>
    <path d="M-20 -350 l10 10 M-10 -350 l-10 10 M10 -350 l10 10 M20 -350 l-10 10" stroke="#3a2a1a" stroke-width="4"/>
    <path d="M-22 -318 Q0 -304 22 -318" stroke="#3a2a1a" stroke-width="3" fill="none" stroke-dasharray="5 4"/>`
  if (s.schal) out += `<path d="M-40 -300 L40 -300 L0 -262 Z" fill="${CFG.farben.schal}"/><circle cx="-6" cy="-292" r="3" fill="#ffffff"/><circle cx="10" cy="-290" r="3" fill="#ffffff"/>`
  if (s.muetze) out += `<ellipse cx="0" cy="-376" rx="80" ry="14" fill="#d9b44a"/><path d="M-40 -378 Q-38 -420 0 -422 Q38 -420 40 -378 Z" fill="#e3c25a"/><rect x="-40" y="-392" width="80" height="10" fill="${CFG.farben.muetze}"/>`
  if (s.besen) out += `<g transform="translate(-120 -300)"><ellipse cx="0" cy="0" rx="18" ry="12" fill="#1f1f24"/><circle cx="14" cy="-12" r="9" fill="#1f1f24"/><path d="M22 -12 L32 -9 L22 -7 Z" fill="#e0a800"/><circle cx="16" cy="-14" r="2" fill="#ffffff"/><path d="M-16 2 L-30 8" stroke="#1f1f24" stroke-width="5"/></g>`
  return out
}

function easter(): string {
  const eggs: [number, number, string, string][] = [
    [520, 900, '#ff8fb1', '#ffffff'], [610, 925, '#6bc5ff', '#ffd54a'], [760, 905, '#ffd54a', '#e67e22'],
    [900, 930, '#8cd17d', '#ffffff'], [1020, 900, '#b48cff', '#ffd54a'], [1110, 935, '#ff6b6b', '#ffffff'],
  ]
  let out = eggs
    .map(([x, y, c, s]) => `<g transform="translate(${x} ${y}) rotate(${(x % 30) - 15})"><ellipse rx="16" ry="21" fill="${c}"/><path d="M-15 -4 Q0 2 15 -4 M-14 6 Q0 12 14 6" stroke="${s}" stroke-width="3" fill="none"/></g>`)
    .join('')
  // A rabbit by the trees.
  out += `<g transform="translate(1060 690)">
    <ellipse cx="0" cy="0" rx="34" ry="26" class="bunny"/><circle cx="30" cy="-24" r="17" class="bunny"/>
    <ellipse cx="24" cy="-56" rx="6" ry="22" class="bunny"/><ellipse cx="38" cy="-56" rx="6" ry="22" class="bunny"/>
    <ellipse cx="24" cy="-56" rx="2.5" ry="15" fill="#f4b6c6"/><ellipse cx="38" cy="-56" rx="2.5" ry="15" fill="#f4b6c6"/>
    <circle cx="36" cy="-27" r="2.6" fill="#2b2b2b"/><circle cx="-33" cy="-4" r="9" fill="#ffffff"/>
  </g>`
  return out
}

function swissDay(): string {
  // Flag on the hill, lanterns, and a small bonfire.
  let lanterns = ''
  const cols = ['#d52b1e', '#ffffff', '#ffd54a']
  for (let i = 0; i < 9; i++) {
    const x = 470 + i * 70
    const y = 120 + Math.round(Math.sin((i / 8) * Math.PI) * 50)
    lanterns += `<g transform="translate(${x} ${y})"><path d="M0 -14 L0 -6" stroke="#555555" stroke-width="2"/><ellipse rx="13" ry="16" fill="${cols[i % 3] ?? '#d52b1e'}" class="lantern" style="animation-delay:${(i * 0.4).toFixed(1)}s"/><rect x="-6" y="14" width="12" height="4" fill="#555555"/></g>`
  }
  return `<path d="M440 92 Q790 190 1060 92" stroke="#555555" stroke-width="2" fill="none"/>${lanterns}
    <g transform="translate(860 575)">
      <rect x="-3" y="-170" width="6" height="170" fill="#8a8a8a"/>
      <g class="flag"><rect x="3" y="-170" width="80" height="80" fill="#d52b1e"/>
      <rect x="35" y="-157" width="16" height="54" fill="#ffffff"/><rect x="16" y="-138" width="54" height="16" fill="#ffffff"/></g>
    </g>
    <g transform="translate(700 600)">
      <path d="M-26 6 L26 -4 M-24 -4 L26 6" stroke="#6b4423" stroke-width="7" stroke-linecap="round"/>
      <path class="fire" d="M-20 0 Q-22 -30 -4 -52 Q-2 -30 8 -40 Q18 -22 20 0 Z" fill="#ff8c1a"/>
      <path class="fire" d="M-10 0 Q-10 -18 0 -30 Q6 -16 10 0 Z" fill="#ffd54a"/>
    </g>`
}

function fireworks(palette: string[], rand: () => number): string {
  let out = ''
  for (let i = 0; i < 6; i++) {
    const cx = Math.round(380 + rand() * 820)
    const cy = Math.round(120 + rand() * 230)
    const c = palette[i % palette.length] ?? '#ffffff'
    let dots = ''
    for (let k = 0; k < 14; k++) {
      const a = (Math.PI * 2 * k) / 14
      dots += `<circle cx="${(Math.cos(a) * 60).toFixed(1)}" cy="${(Math.sin(a) * 60).toFixed(1)}" r="3.2" fill="${c}"/>`
    }
    out += `<g transform="translate(${cx} ${cy})"><g class="fw" style="animation-delay:${(i * 1.15).toFixed(2)}s">${dots}</g></g>`
  }
  return `<g class="fireworks">${out}</g>`
}

function presents(): string {
  return `<g transform="translate(600 860)">
    <rect x="-40" y="-50" width="60" height="50" fill="#c0392b"/><rect x="-14" y="-50" width="8" height="50" fill="#ffd54a"/><rect x="-40" y="-29" width="60" height="8" fill="#ffd54a"/>
    <rect x="28" y="-36" width="44" height="36" fill="#2f6a9a"/><rect x="46" y="-36" width="8" height="36" fill="#ffffff"/><rect x="28" y="-22" width="44" height="7" fill="#ffffff"/>
  </g>`
}

// ── the whole scene ──────────────────────────────────────────────────────

export function buildScene(input: SceneInput): string {
  const p = clamp(input.percent, 0, 100)
  const y = jahreslauf(input.date)
  const rand = seeded(7)
  const clicked = input.click !== undefined
  const gl = ground('light', y)
  const gd = ground('dark', y)
  const sky = SKY[input.weather]

  let figure: string
  if (y.figure === 'schneemann') {
    figure = snowman(y, p)
  } else if (y.figure === 'reste') {
    figure = remains(p)
  } else {
    figure = scarecrow(p)
  }
  const scale = clamp(CFG.figurGroesse, 0.6, 1.6).toFixed(2)

  let extras = ''
  let sky2 = ''
  if (y.anlass === 'ostern') extras += easter()
  if (y.anlass === 'nationalfeiertag') {
    extras += swissDay()
    sky2 += fireworks(['#d52b1e', '#ffffff', '#ff6b6b'], seeded(3))
  }
  if (y.anlass === 'silvester' || y.anlass === 'neujahr') {
    sky2 += fireworks(['#ffd54a', '#6bc5ff', '#ff6b6b', '#8cff8c', '#ffffff'], seeded(5))
  }
  if (y.anlass === 'weihnachten') extras += presents()

  const greeting = y.anlass === 'neujahr' ? `<text x="800" y="90" text-anchor="middle" class="greet">Es guets Neus!</text>` : ''

  const label = escapeXml(input.modelLabel || 'Modell wird geladen')
  const sub = escapeXml(`${Math.round(p)} % Kontext · ${y.anlass ? ANLASS_NAME[y.anlass] : y.season}`)

  const fog =
    input.weather === 'nebel'
      ? `<g class="fogs" filter="url(#soft)"><rect class="fog fog1" x="-400" y="520" width="2400" height="120" rx="60"/><rect class="fog fog2" x="-400" y="640" width="2400" height="140" rx="70"/><rect class="fog fog1" x="-400" y="400" width="2400" height="90" rx="45"/></g>`
      : ''
  const aurora =
    input.weather === 'abendrot'
      ? `<g class="aurora"><path d="M-200 200 C 100 90 600 260 900 140 C 1150 50 1500 210 1800 120 L1800 230 C 1500 310 1150 150 900 240 C 600 360 100 190 -200 300 Z"/></g>`
      : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
  .sky0 { stop-color: ${sky.light[0]}; } .sky1 { stop-color: ${sky.light[1]}; } .sky2 { stop-color: ${sky.light[2]}; }
  .far { fill: ${gl.far}; } .near { fill: ${gl.near}; } .ground { fill: ${gl.ground}; }
  .pine { fill: #3c6b5a; } .pine2 { fill: #2f5a4b; } .cap { fill: #ffffff; } .trunk { fill: #6b4a2f; }
  .snowball { fill: #ffffff; stroke: #c9d8e6; stroke-width: 3; }
  .coal { fill: #2b2b2b; } .stick { stroke: #6b4423; stroke-width: 6; stroke-linecap: round; fill: none; }
  .puddle { fill: #9cc4e4; opacity: 0.55; }
  .clump, .gs { fill: #ffffff; stroke: #9fb8cf; stroke-width: 0.8; }
  .bunny { fill: #c8b39a; }
  .wing { stroke: #2b2b2b; stroke-width: 3; fill: none; stroke-linecap: round; }
  .stars { fill: #ffffff; opacity: 0; }
  .sun { opacity: 1; } .moon { opacity: 0; }
  .sun .disc { fill: #ffd76a; } .sun .halo { fill: #fff1b8; opacity: 0.55; }
  .moon .disc { fill: #fff6d8; } .crater { fill: #eadfb8; }
  .eye { fill: #4a3b1a; } .smile { stroke: #4a3b1a; stroke-width: 4; fill: none; stroke-linecap: round; } .cheek { fill: #ff9a8a; opacity: 0.55; }
  .face { animation: fadein 0.8s ease-out both; }
  .f { animation-name: fall0; animation-timing-function: linear; animation-iteration-count: infinite; }
  .s { fill: #ffffff; stroke: #7f9fbd; stroke-width: 1; }
  .fluff { fill: #fffbe6; stroke: #c9b97a; stroke-width: 0.8; }
  .f1 { animation-name: fall1; } .f2 { animation-name: fall2; }
  .l0 { animation-name: leaf0; } .l1 { animation-name: leaf1; } .l2 { animation-name: leaf2; }
  .g { opacity: 0; animation: gust0 3.2s ease-out 1 both; }
  .g1 { animation-name: gust1; } .g2 { animation-name: gust2; } .g3 { animation-name: gust3; }
  .tree { transform-box: fill-box; transform-origin: 50% 100%; }
  .shake { animation: shake 1.4s ease-in-out 1; }
  .drop { opacity: 0; animation: drop 1.8s ease-in 1 both; }
  .bird { opacity: 0; animation: fly 3s ease-in 1 both; }
  .bulb { animation: glow 3s ease-in-out infinite; }
  .xstar { fill: #ffd54a; stroke: #e0a800; stroke-width: 2; }
  .lantern { animation: sway 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 0%; }
  .flag { animation: wave 3s ease-in-out infinite; transform-box: fill-box; transform-origin: 0% 50%; }
  .fire { animation: fire 2s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
  .fw { opacity: 0; animation: burst 7s ease-out infinite; }
  .fireworks { opacity: 0.55; }
  .fog { fill: #ffffff; opacity: 0.55; } .fog1 { animation: drift 60s ease-in-out infinite alternate; } .fog2 { animation: drift 80s ease-in-out infinite alternate-reverse; }
  .aurora path { fill: url(#aur); opacity: 0; }
  .greet { font-family: sans-serif; font-size: 44px; font-weight: 700; fill: #c0392b; }
  .lbl { font-family: sans-serif; font-size: 22px; font-weight: 600; fill: #16324a; }
  .sub { font-family: sans-serif; font-size: 15px; fill: #3a5670; }
  .pill { fill: #ffffff; opacity: 0.72; }
  @keyframes fall0 { from { transform: translate(0px, -1000px); } to { transform: translate(40px, 1000px); } }
  @keyframes fall1 { from { transform: translate(0px, -1000px); } to { transform: translate(-50px, 1000px); } }
  @keyframes fall2 { from { transform: translate(0px, -1000px); } to { transform: translate(15px, 1000px); } }
  @keyframes leaf0 { from { transform: translate(0px, -1000px) rotate(0deg); } 50% { transform: translate(60px, 0px) rotate(200deg); } to { transform: translate(0px, 1000px) rotate(400deg); } }
  @keyframes leaf1 { from { transform: translate(0px, -1000px) rotate(0deg); } 50% { transform: translate(-70px, 0px) rotate(-180deg); } to { transform: translate(0px, 1000px) rotate(-360deg); } }
  @keyframes leaf2 { from { transform: translate(0px, -1000px) rotate(0deg); } 50% { transform: translate(30px, 0px) rotate(120deg); } to { transform: translate(-20px, 1000px) rotate(300deg); } }
  @keyframes gust0 { 0% { opacity: 0; transform: translate(0px, 0px); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(420px, -160px) rotate(220deg); } }
  @keyframes gust1 { 0% { opacity: 0; transform: translate(0px, 0px); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(-380px, -120px) rotate(-200deg); } }
  @keyframes gust2 { 0% { opacity: 0; transform: translate(0px, 0px); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(260px, 220px) rotate(160deg); } }
  @keyframes gust3 { 0% { opacity: 0; transform: translate(0px, 0px); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(-200px, 240px) rotate(-140deg); } }
  @keyframes shake { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(-2deg); } 45% { transform: rotate(1.6deg); } 70% { transform: rotate(-0.8deg); } }
  @keyframes drop { 0% { opacity: 1; transform: translate(0px, 0px); } 80% { opacity: 1; } 100% { opacity: 0; transform: translate(10px, 190px); } }
  @keyframes fly { 0% { opacity: 1; transform: translate(0px, 0px) scale(1); } 100% { opacity: 0; transform: translate(380px, -320px) scale(0.6); } }
  @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
  @keyframes glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
  @keyframes sway { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
  @keyframes wave { 0%, 100% { transform: skewY(0deg); } 50% { transform: skewY(-4deg); } }
  @keyframes fire { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(0.94, 1.08); } }
  @keyframes burst { 0% { opacity: 0; transform: scale(0.15); } 8% { opacity: 1; } 30% { opacity: 0.8; transform: scale(1); } 45% { opacity: 0; transform: scale(1.1); } 100% { opacity: 0; transform: scale(1.1); } }
  @keyframes drift { from { transform: translate(-120px, 0px); } to { transform: translate(120px, 0px); } }
  @media (prefers-color-scheme: dark) {
    .sky0 { stop-color: ${sky.dark[0]}; } .sky1 { stop-color: ${sky.dark[1]}; } .sky2 { stop-color: ${sky.dark[2]}; }
    .far { fill: ${gd.far}; } .near { fill: ${gd.near}; } .ground { fill: ${gd.ground}; }
    .pine { fill: #1d3b36; } .pine2 { fill: #16302c; } .cap { fill: #c9d8e8; }
    .snowball { fill: #e8eef6; stroke: #9fb3c9; }
    .puddle { fill: #5f86a8; }
    .stars { opacity: ${input.weather === 'klar' ? 0.8 : 0.3}; }
    .sun { opacity: 0; } .moon { opacity: 1; }
    .s { stroke: none; } .clump, .gs { stroke: none; }
    .fluff { fill: #fff7a8; stroke: none; }
    .fireworks { opacity: 1; }
    .fog { fill: #9fb0c2; opacity: 0.25; }
    .aurora path { opacity: 0.45; animation: drift 40s ease-in-out infinite alternate; }
    .wing { stroke: #c9d8e8; }
    .greet { fill: #ffd54a; }
    .lbl { fill: #eaf1f8; } .sub { fill: #b8c8da; }
    .pill { fill: #0f1724; opacity: 0.7; }
  }
</style>
<defs>
  <linearGradient id="aur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dffc4" stop-opacity="0"/><stop offset="0.5" stop-color="#4dffa6" stop-opacity="0.9"/><stop offset="1" stop-color="#9a7dff" stop-opacity="0"/></linearGradient>
  <filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" class="sky0"/><stop offset="0.55" class="sky1"/><stop offset="1" class="sky2"/>
  </linearGradient>
</defs>
<!-- sky -->
<rect width="1600" height="1000" fill="url(#sky)"/>
${stars(seeded(11))}
${aurora}
<g ${input.weather === 'nebel' ? 'opacity="0.45"' : ''}>${celestial(clicked)}</g>
${sky2}
${greeting}
<!-- hills -->
<path class="far" d="M0 640 C 220 560 420 600 640 570 C 880 535 1100 600 1320 560 C 1450 540 1530 560 1600 575 L1600 1000 L0 1000 Z"/>
${pines(y, y.anlass, clicked, seeded(21))}
<path class="near" d="M0 740 C 260 690 520 720 800 700 C 1080 680 1320 730 1600 705 L1600 1000 L0 1000 Z"/>
<path class="ground" d="M0 840 C 300 815 700 835 1000 822 C 1250 812 1450 830 1600 825 L1600 1000 L0 1000 Z"/>
${fog}
${extras}
<!-- figure, pinned bottom left -->
<svg x="0" y="0" width="1600" height="1000" viewBox="0 0 1600 1000" preserveAspectRatio="xMinYMax meet">
  <g transform="translate(290 860) scale(${scale})">${figure}</g>
</svg>
<!-- falling things -->
<g>${particles(y, p, rand)}</g>
${input.click ? `<g>${gust(y, input.click, seeded(input.click.seq + 101))}</g>` : ''}
<!-- label, pinned top left -->
<svg x="0" y="0" width="1600" height="1000" viewBox="0 0 1600 1000" preserveAspectRatio="xMinYMin meet">
  <rect class="pill" x="24" y="24" width="330" height="72" rx="16"/>
  <text class="lbl" x="44" y="58">${label}</text>
  <text class="sub" x="44" y="82">${sub}</text>
</svg>
</svg>`
}
