import { t, type Occasion, type Season } from './i18n.js'
import { SETTINGS, type Weather } from './settings.js'

const CFG = SETTINGS

export type DateParts = { y: number; m: number; d: number }

export type Mood = 'cheer' | 'fright'

export type SceneInput = {
  percent: number
  /** How the figure feels right now: cheering after passing tests, startled after an error. */
  mood?: Mood
  modelLabel: string
  weather: Weather
  date: DateParts
  /** Shows this occasion whatever the date says (for previews). */
  occasion?: Occasion
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
function ramp(date: DateParts, from: [number, number], to: [number, number]): number {
  const now = dayNumber(date.y, date.m, date.d)
  const a = dayNumber(date.y, from[0], from[1])
  const b = dayNumber(date.y, to[0], to[1])
  if (b <= a) {
    return now >= b ? 1 : 0
  }
  return clamp((now - a) / (b - a))
}

export function easterSunday(y: number): DateParts {
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

export type YearState = {
  /** Snow on the ground, 0 to 1. */
  snow: number
  /** Autumn colours, 0 to 1. */
  autumn: number
  /** Snowman built, 0 to 1 (balls appear one by one). */
  build: number
  /** Snowman melted, 0 to 1. */
  melt: number
  figure: 'snowman' | 'remains' | 'scarecrow'
  season: Season
  occasion?: Occasion
  /** Weights of the falling things: snow, petals, fluff, leaves. */
  fall: { snow: number; petal: number; fluff: number; leaf: number }
}

export function yearState(date: DateParts, forced?: Occasion): YearState {
  const k = CFG.calendar
  const { m } = date
  const snowIn = ramp(date, k.snowStarts, k.snowComplete)
  const snowOut = ramp(date, k.thawStart, k.thawEnd)
  const inLateYear = m >= 9
  const snow = inLateYear ? snowIn : 1 - snowOut
  const build = inLateYear ? ramp(date, k.snowmanBuildStart, k.snowmanBuildEnd) : 1
  const melt = inLateYear ? 0 : snowOut

  // Leaves turn from September to mid October and stay until the snow covers them.
  const autumn = inLateYear ? ramp(date, [9, 1], [10, 15]) : 0

  let figure: YearState['figure']
  if (inLateYear && build > 0) {
    figure = 'snowman'
  } else if (!inLateYear && melt < 1) {
    figure = 'snowman'
  } else if (m >= 4 && m <= 5) {
    figure = 'remains'
  } else {
    figure = 'scarecrow'
  }

  let season: Season
  if (snow >= 0.99) {
    season = 'winter'
  } else if (!inLateYear && melt > 0 && melt < 1) {
    season = 'thaw'
  } else if (inLateYear && snow > 0) {
    season = 'firstSnow'
  } else if (m >= 3 && m <= 5) {
    season = 'spring'
  } else if (m >= 6 && m <= 8) {
    season = 'summer'
  } else {
    season = 'autumn'
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

  return { snow, autumn, build, melt, figure, season, occasion: forced ?? occasionOn(date), fall }
}

function fromDayNumber(n: number): DateParts {
  const t = new Date(n * 86400000)
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}

/** The day number of the nth given weekday (0 = Sunday) of a month. */
function nthWeekday(y: number, m: number, weekday: number, n: number): number {
  const first = dayNumber(y, m, 1)
  const firstWeekday = new Date(first * 86400000).getUTCDay()
  return first + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7
}

/** First and last day of carnival in the year, by the town in the settings (Easter-relative). */
function carnivalDays(y: number): [number, number] {
  const e = easterSunday(y)
  const easter = dayNumber(e.y, e.m, e.d)
  if (CFG.location === 'basel') {
    return [easter - 41, easter - 39] // Monday to Wednesday after Ash Wednesday
  }
  if (CFG.location === 'bern') {
    return [easter - 43, easter - 41] // Thursday to Saturday after Ash Wednesday
  }
  return [easter - 52, easter - 47] // Schmutziger Donnerstag to Güdisdienstag
}

/** Zurich's spring festival: the third Monday in April, a week later when that is Easter Monday. */
function sechselaeutenDay(y: number): number {
  const e = easterSunday(y)
  const third = nthWeekday(y, 4, 1, 3)
  return third === dayNumber(e.y, e.m, e.d) + 1 ? third + 7 : third
}

/** The first day of each occasion in a year, for previews. */
export function occasionStart(o: Occasion, y: number): DateParts {
  const e = easterSunday(y)
  const easter = dayNumber(e.y, e.m, e.d)
  const days: Record<Occasion, number> = {
    valentinesDay: dayNumber(y, 2, 14),
    carnival: carnivalDays(y)[0],
    womensDay: dayNumber(y, 3, 8),
    easter,
    sechselaeuten: sechselaeutenDay(y),
    labourDay: dayNumber(y, 5, 1),
    mothersDay: nthWeekday(y, 5, 0, 2),
    ascension: easter + 39,
    pentecost: easter + 49,
    solstice: dayNumber(y, 6, 21),
    swissNationalDay: dayNumber(y, 8, 1),
    halloween: dayNumber(y, 10, 31),
    stNicholas: dayNumber(y, 12, 6),
    advent: dayNumber(y, 12, 1),
    christmas: dayNumber(y, 12, 24),
    newYearsEve: dayNumber(y, 12, 31),
    newYear: dayNumber(y, 1, 1),
  }
  return fromDayNumber(days[o])
}

export function occasionOn(date: DateParts): Occasion | undefined {
  const on = CFG.occasions
  const { y, m, d } = date
  const today = dayNumber(y, m, d)
  const e = easterSunday(y)
  const easter = dayNumber(e.y, e.m, e.d)
  const [carnivalFrom, carnivalTo] = carnivalDays(y)
  if (on.carnival && today >= carnivalFrom && today <= carnivalTo) {
    return 'carnival'
  }
  if (on.easter && today >= easter - 2 && today <= easter + 1) {
    return 'easter'
  }
  if (on.ascension && today === easter + 39) {
    return 'ascension'
  }
  if (on.pentecost && today >= easter + 49 && today <= easter + 50) {
    return 'pentecost'
  }
  if (on.valentinesDay && m === 2 && d === 14) {
    return 'valentinesDay'
  }
  if (on.womensDay && m === 3 && d === 8) {
    return 'womensDay'
  }
  if (on.sechselaeuten && CFG.location === 'zurich' && today === sechselaeutenDay(y)) {
    return 'sechselaeuten'
  }
  if (on.labourDay && m === 5 && d === 1) {
    return 'labourDay'
  }
  if (on.mothersDay && today === nthWeekday(y, 5, 0, 2)) {
    return 'mothersDay'
  }
  if (on.solstice && m === 6 && d === 21) {
    return 'solstice'
  }
  if (on.halloween && m === 10 && d >= 30) {
    return 'halloween'
  }
  if (on.swissNationalDay && ((m === 7 && d === 31) || (m === 8 && d === 1))) {
    return 'swissNationalDay'
  }
  if (on.stNicholas && m === 12 && d === 6) {
    return 'stNicholas'
  }
  if (on.newYear && m === 12 && d === 31) {
    return 'newYearsEve'
  }
  if (on.newYear && m === 1 && d === 1) {
    return 'newYear'
  }
  if (on.christmas && m === 12 && d >= 24 && d <= 26) {
    return 'christmas'
  }
  if (on.advent && m === 12 && d < 24) {
    return 'advent'
  }
  return undefined
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

function ground(mode: 'light' | 'dark', y: YearState): Ground {
  const g = GROUND[mode]
  const base = (k: keyof Ground): string => mix(mix(g.green[k], g.autumn[k], y.autumn), g.snow[k], y.snow)
  return { far: base('far'), near: base('near'), ground: base('ground') }
}

const SKY: Record<Weather, { light: [string, string, string]; dark: [string, string, string] }> = {
  clear: { light: ['#9fc6e8', '#c7def1', '#eef5fb'], dark: ['#070f1c', '#13233c', '#23395a'] },
  sunset: { light: ['#6f82bd', '#f0a384', '#fbd9a8'], dark: ['#140b26', '#3a1f48', '#6a3558'] },
  fog: { light: ['#bfc8d1', '#d6dde3', '#e9edf0'], dark: ['#171c23', '#262e38', '#3a444f'] },
  magic: { light: ['#a993e0', '#e2c6f0', '#fde8f2'], dark: ['#0f0826', '#2a1452', '#4d2a72'] },
}

// ── pieces of the scene ───────────────────────────────────────────────────

function particles(y: YearState, percent: number, rand: () => number): string {
  const p = clamp(percent / 100)
  const count = Math.round(CFG.flakes.minimum + p * (CFG.flakes.maximum - CFG.flakes.minimum))
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

function gust(y: YearState, click: { x: number; y: number }, rand: () => number): string {
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
  return `<g transform="translate(1150 200)">
    <g class="sun"><circle r="58" class="halo"/><circle r="44" class="disc"/>${face}</g>
    <g class="moon"><circle r="46" class="disc"/><circle cx="-14" cy="12" r="7" class="crater"/><circle cx="16" cy="-14" r="5" class="crater"/>${face}</g>
  </g>`
}

function pines(y: YearState, occasion: Occasion | undefined, clicked: boolean, rand: () => number): string {
  const n = Math.max(0, Math.min(8, Math.round(CFG.trees)))
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
  if (n > 0 && (occasion === 'advent' || occasion === 'christmas')) {
    const colors = ['#ffd54a', '#ff6b6b', '#6bc5ff', '#8cff8c']
    let lights = ''
    for (let k = 0; k < 14; k++) {
      const row = Math.floor(k / 4)
      const lx = tallest.x + Math.round((((k % 4) - 1.5) / 1.5) * (14 + row * 18))
      const ly = tallest.top + 40 + row * 38 + (k % 2) * 6
      lights += `<circle cx="${lx}" cy="${ly}" r="4.5" fill="${colors[k % 4] ?? '#ffd54a'}" class="bulb" style="animation-delay:${((k % 5) * 0.6).toFixed(1)}s"/>`
    }
    out += lights
    if (occasion === 'christmas') {
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

function stage(percent: number): { hat: boolean; scarf: boolean; broom: boolean } {
  return {
    hat: percent >= CFG.stages.hat,
    scarf: percent >= CFG.stages.scarf,
    broom: percent >= CFG.stages.broom,
  }
}

function beanie(cx: number, cy: number, rot = 0): string {
  const c = CFG.colors
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})">
    <path d="M-44 0 Q-46 -58 0 -62 Q46 -58 44 0 Z" fill="${c.hat}"/>
    <rect x="-48" y="-12" width="96" height="18" rx="8" fill="${mix(c.hat, '#000000', 0.25)}"/>
    <circle cx="0" cy="-66" r="14" fill="${c.pompom}"/>
  </g>`
}

function scarf(cy: number): string {
  const c = CFG.colors.scarf
  const dark = mix(c, '#000000', 0.2)
  return `<path d="M-52 ${cy} Q0 ${cy + 22} 52 ${cy} L56 ${cy + 16} Q0 ${cy + 40} -56 ${cy + 16} Z" fill="${c}"/>
    <path d="M26 ${cy + 14} L44 ${cy + 78} L24 ${cy + 80} L12 ${cy + 18} Z" fill="${dark}"/>
    <path d="M28 ${cy + 76} l3 10 M35 ${cy + 75} l3 10 M42 ${cy + 74} l3 10" stroke="${dark}" stroke-width="3"/>`
}

function broom(x: number, top: number, bottom: number): string {
  const c = CFG.colors
  return `<path d="M${x} ${top} L${x + 6} ${bottom - 60}" stroke="${c.broomHandle}" stroke-width="8" stroke-linecap="round"/>
    <path d="M${x - 22} ${bottom} L${x - 4} ${bottom - 64} L${x + 16} ${bottom - 64} L${x + 36} ${bottom} Z" fill="${c.broomBristles}"/>
    <path d="M${x - 2} ${bottom - 52} L${x + 14} ${bottom - 52}" stroke="${mix(c.broomBristles, '#000000', 0.35)}" stroke-width="4"/>`
}

/** Little signs above the head: confetti for joy, an exclamation mark for a fright. */
function moodMarks(mood: Mood | undefined, top: number): string {
  if (mood === 'cheer') {
    const cols = ['#ffd54a', '#ff6b6b', '#6bc5ff', '#8cff8c', '#f49ab5']
    let out = ''
    for (let i = 0; i < 12; i++) {
      const x = Math.round(Math.cos(i * 2.1) * (60 + (i % 3) * 30))
      const y = top + Math.round(Math.sin(i * 1.7) * 30)
      out += `<g transform="translate(${x} ${y}) rotate(${i * 37})"><rect class="confetti" x="-5" y="-3" width="10" height="6" fill="${cols[i % 5] ?? '#ffd54a'}" style="animation-delay:${((i % 4) * 0.15).toFixed(2)}s"/></g>`
    }
    return out
  }
  if (mood === 'fright') {
    return `<g class="bang" transform="translate(95 ${top + 10})"><rect x="-7" y="-50" width="14" height="38" rx="5" fill="#d52b1e"/><circle cx="0" cy="0" r="8" fill="#d52b1e"/></g>`
  }
  return ''
}


// ── costumes: what the figure wears on occasions ─────────────────────────

type Costume = { hat?: string; hand?: string; face?: string }

function costumeFor(occasion: Occasion | undefined): Costume {
  if (!CFG.costumes || occasion === undefined) {
    return {}
  }
  switch (occasion) {
    case 'halloween':
      return { hat: 'witch' }
    case 'christmas':
      return { hat: 'santa' }
    case 'stNicholas':
      return { hat: 'mitre', face: 'beard' }
    case 'easter':
      return { hat: 'bunny' }
    case 'newYearsEve':
    case 'newYear':
      return { hat: 'party' }
    case 'carnival':
      return { hat: 'jester' }
    case 'swissNationalDay':
      return { hand: 'flag' }
    case 'valentinesDay':
      return { hand: 'rose' }
    case 'mothersDay':
      return { hand: 'bouquet' }
    case 'womensDay':
      return { hand: 'mimosa' }
    case 'solstice':
      return { face: 'sunglasses' }
    default:
      return {}
  }
}

/** A costume hat, its brim at (0, 0) and pointing up. */
function costumeHat(kind: string): string {
  switch (kind) {
    case 'witch':
      return `<ellipse cx="0" cy="-2" rx="76" ry="13" fill="#1f1a26"/>
        <path d="M-36 -6 L10 -124 L22 -112 L36 -6 Z" fill="#2a2233"/>
        <path d="M-34 -12 L35 -12 L33 -26 L-31 -26 Z" fill="#7b3fa0"/>
        <rect x="-8" y="-28" width="16" height="18" rx="2" fill="none" stroke="#ffd54a" stroke-width="3"/>`
    case 'santa':
      return `<path d="M-44 -8 Q-30 -80 20 -86 Q60 -80 70 -30 L56 -26 Q48 -60 18 -60 Q-6 -50 44 -8 Z" fill="#c0392b"/>
        <rect x="-50" y="-16" width="100" height="20" rx="10" fill="#ffffff"/>
        <circle cx="64" cy="-24" r="13" fill="#ffffff"/>`
    case 'mitre':
      return `<path d="M-38 -6 L-38 -54 Q-20 -104 0 -116 Q20 -104 38 -54 L38 -6 Z" fill="#c0392b"/>
        <path d="M-38 -6 L38 -6 L38 -18 L-38 -18 Z M-5 -98 L5 -98 L5 -24 L-5 -24 Z" fill="#e8c34a"/>
        <path d="M-16 -64 L16 -64 L16 -54 L-16 -54 Z" fill="#e8c34a"/>`
    case 'bunny':
      return `<path d="M-48 -4 Q0 -22 48 -4" stroke="#f4b6c6" stroke-width="8" fill="none"/>
        <ellipse cx="-20" cy="-58" rx="13" ry="48" fill="#ffffff" stroke="#d8c8d0" stroke-width="2" transform="rotate(-12 -20 -58)"/>
        <ellipse cx="22" cy="-58" rx="13" ry="48" fill="#ffffff" stroke="#d8c8d0" stroke-width="2" transform="rotate(14 22 -58)"/>
        <ellipse cx="-20" cy="-58" rx="6" ry="34" fill="#f4b6c6" transform="rotate(-12 -20 -58)"/>
        <ellipse cx="22" cy="-58" rx="6" ry="34" fill="#f4b6c6" transform="rotate(14 22 -58)"/>`
    case 'party':
      return `<path d="M-30 -4 L0 -100 L30 -4 Z" fill="#6bc5ff"/>
        <path d="M-22 -28 L22 -28 L18 -42 L-18 -42 Z M-12 -62 L12 -62 L9 -74 L-9 -74 Z" fill="#ffd54a"/>
        <circle cx="0" cy="-104" r="10" fill="#ff6b6b"/>`
    case 'jester':
      return `<path d="M-44 -4 Q-60 -70 -96 -60 Q-60 -40 -10 -40 Z" fill="#d52b1e"/>
        <path d="M44 -4 Q60 -70 96 -60 Q60 -40 10 -40 Z" fill="#ffd54a"/>
        <path d="M-40 -4 Q-20 -70 0 -76 Q20 -70 40 -4 Z" fill="#2f6a9a"/>
        <circle cx="-98" cy="-58" r="9" fill="#e8c34a"/><circle cx="98" cy="-58" r="9" fill="#e8c34a"/><circle cx="0" cy="-80" r="9" fill="#e8c34a"/>
        <rect x="-46" y="-14" width="92" height="14" rx="6" fill="#ffffff"/>`
    default:
      return ''
  }
}

/** Something held in the hand at (x, y). */
function handItem(kind: string, x: number, y: number): string {
  switch (kind) {
    case 'flag':
      return `<g transform="translate(${x} ${y})"><path d="M0 0 L0 -110" stroke="#8a8a8a" stroke-width="4"/>
        <rect x="2" y="-110" width="46" height="46" fill="#d52b1e"/><rect x="21" y="-102" width="9" height="30" fill="#ffffff"/><rect x="10" y="-91" width="30" height="9" fill="#ffffff"/></g>`
    case 'rose':
      return `<g transform="translate(${x} ${y})"><path d="M0 0 Q6 -40 2 -70" stroke="#3f7d3a" stroke-width="4" fill="none"/>
        <path d="M2 -40 Q20 -50 22 -36 Q10 -34 2 -40 Z" fill="#3f7d3a"/>
        <circle cx="2" cy="-78" r="14" fill="#c0392b"/><path d="M-6 -80 Q2 -90 10 -80" stroke="#8e1f1f" stroke-width="3" fill="none"/></g>`
    case 'bouquet':
      return `<g transform="translate(${x} ${y})"><path d="M-4 0 L-14 -60 M0 0 L0 -66 M4 0 L14 -60" stroke="#3f7d3a" stroke-width="3"/>
        <circle cx="-14" cy="-66" r="11" fill="#f49ab5"/><circle cx="0" cy="-74" r="12" fill="#ffd54a"/><circle cx="14" cy="-66" r="11" fill="#b48cff"/>
        <path d="M-12 -20 L12 -20 L4 4 L-4 4 Z" fill="#f4e3c3"/></g>`
    case 'mimosa':
      return `<g transform="translate(${x} ${y})"><path d="M0 0 Q4 -30 -6 -60 M2 -30 Q16 -44 22 -58" stroke="#5a7d3a" stroke-width="3" fill="none"/>
        <circle cx="-6" cy="-64" r="7" fill="#ffd21f"/><circle cx="4" cy="-56" r="6" fill="#ffe14d"/><circle cx="-12" cy="-52" r="6" fill="#ffd21f"/><circle cx="22" cy="-62" r="7" fill="#ffe14d"/><circle cx="14" cy="-54" r="6" fill="#ffd21f"/></g>`
    default:
      return ''
  }
}

/** Sunglasses or a beard, around eyes at (±ex, ey). */
function costumeFace(kind: string, ex: number, ey: number): string {
  if (kind === 'sunglasses') {
    return `<rect x="${-ex - 15}" y="${ey - 10}" width="30" height="20" rx="8" fill="#1f1f24"/><rect x="${ex - 15}" y="${ey - 10}" width="30" height="20" rx="8" fill="#1f1f24"/>
      <path d="M${-ex + 15} ${ey - 2} L${ex - 15} ${ey - 2}" stroke="#1f1f24" stroke-width="4"/>`
  }
  if (kind === 'beard') {
    return `<path d="M-40 ${ey + 22} Q-44 ${ey + 80} 0 ${ey + 96} Q44 ${ey + 80} 40 ${ey + 22} Q20 ${ey + 40} 0 ${ey + 30} Q-20 ${ey + 40} -40 ${ey + 22} Z" fill="#ffffff" stroke="#c9ced6" stroke-width="3"/>`
  }
  return ''
}

function snowman(y: YearState, percent: number, mood?: Mood): string {
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
    const eyes =
      mood === 'cheer'
        ? `<path d="M-24 -340 Q-16 -352 -8 -340 M8 -340 Q16 -352 24 -340" stroke="#2b2b2b" stroke-width="5" fill="none" stroke-linecap="round"/>`
        : mood === 'fright'
          ? `<circle cx="-17" cy="-344" r="11" fill="#ffffff" stroke="#2b2b2b" stroke-width="3"/><circle cx="17" cy="-344" r="11" fill="#ffffff" stroke="#2b2b2b" stroke-width="3"/><circle cx="-17" cy="-344" r="4" class="coal"/><circle cx="17" cy="-344" r="4" class="coal"/>`
          : `<circle cx="-16" cy="-342" r="6" class="coal"/><circle cx="16" cy="-342" r="6" class="coal"/>`
    const mouth =
      mood === 'cheer'
        ? `<path d="M-24 -314 Q0 -286 24 -314 Z" fill="#2b2b2b"/><path d="M-12 -302 Q0 -294 12 -302" stroke="#e05a5a" stroke-width="4" fill="none" stroke-linecap="round"/>`
        : mood === 'fright'
          ? `<ellipse cx="0" cy="-306" rx="9" ry="12" fill="#2b2b2b"/>`
          : `<path d="M-20 -310 Q0 -298 20 -310" stroke="#2b2b2b" stroke-width="4" fill="none" stroke-linecap="round"/>`
    // Where the hands are, by mood.
    const hand = mood === 'cheer' ? { l: [-140, -380], r: [140, -380] } : mood === 'fright' ? { l: [-170, -248], r: [170, -248] } : { l: [-150, -290], r: [150, -280] }
    const arm = (sx: number, end: number[]): string => {
      const ex = end[0] ?? 0
      const ey = end[1] ?? 0
      const mx = sx + (ex - sx) * 0.65
      const my = -230 + (ey + 230) * 0.65
      return `<path d="M${sx} -230 L${ex} ${ey} M${mx} ${my} L${mx + (ex > 0 ? 18 : -18)} ${my - 26} M${mx} ${my} L${mx + (ex > 0 ? 30 : -30)} ${my + 6}" class="stick"/>`
    }
    face = `<circle cx="0" cy="-245" r="7" class="coal"/><circle cx="0" cy="-215" r="7" class="coal"/><circle cx="0" cy="-185" r="7" class="coal"/>
      ${eyes}
      <path d="M0 -330 L44 -322 L0 -318 Z" fill="#e67e22"/>
      ${mouth}
      ${arm(-62, hand.l)}${arm(62, hand.r)}`
    if (s.scarf) face += scarf(-285)
    if (s.broom) {
      face += broom(mood === undefined ? 158 : 200, mood === undefined ? -330 : -300, 10)
      face += `<circle cx="${hand.l[0]}" cy="${hand.l[1]}" r="13" fill="${CFG.colors.mittens}"/><circle cx="${hand.r[0]}" cy="${hand.r[1]}" r="13" fill="${CFG.colors.mittens}"/>`
    }
    const costume = costumeFor(y.occasion)
    if (costume.face !== undefined) face += costumeFace(costume.face, 16, -342)
    if (costume.hand !== undefined) face += handItem(costume.hand, hand.r[0] ?? 150, hand.r[1] ?? -280)
    const hatClass = mood === 'fright' ? 'hatpop' : ''
    if (costume.hat !== undefined) {
      face += `<g class="${hatClass}"><g transform="translate(0 -370) rotate(${m * 25})">${costumeHat(costume.hat)}</g></g>`
    } else if (s.hat) {
      face += `<g class="${hatClass}">${beanie(0, -366, m * 25)}</g>`
    }
    face += moodMarks(mood, -440)
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
  if (s.hat) out += beanie(-110, -6, -70)
  if (s.scarf) out += `<path d="M20 -8 Q70 -26 130 -8 L126 4 Q70 -12 24 4 Z" fill="${CFG.colors.scarf}"/>`
  if (s.broom) out += `<g transform="rotate(-80 180 0)">${broom(180, -200, 0)}</g>`
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

function scarecrow(percent: number, mood?: Mood, occasion?: Occasion): string {
  const s = stage(percent)
  let out = `<ellipse cx="0" cy="0" rx="110" ry="14" fill="#000000" opacity="0.08"/>
    <rect x="-7" y="-380" width="14" height="384" fill="#7a5230"/>
    <rect x="-150" y="-290" width="300" height="12" fill="#7a5230"/>
    <path d="M-120 -296 L120 -296 L80 -150 L-80 -150 Z" fill="#4a78a8"/>
    <path d="M-120 -296 L-80 -150 M-60 -296 L-40 -150 M0 -296 L0 -150 M60 -296 L40 -150 M120 -296 L80 -150 M-110 -260 L110 -260 M-100 -220 L100 -220 M-90 -185 L90 -185" stroke="#2f5a85" stroke-width="3"/>
    <path d="M-152 -292 l-18 -10 M-152 -284 l-20 4 M-152 -288 l-16 14 M152 -292 l18 -10 M152 -284 l20 4 M152 -288 l16 14" stroke="#d9b44a" stroke-width="4" stroke-linecap="round"/>
    <circle cx="0" cy="-340" r="46" fill="#d8b98a"/>
    <path d="M-20 -350 l10 10 M-10 -350 l-10 10 M10 -350 l10 10 M20 -350 l-10 10" stroke="#3a2a1a" stroke-width="4"/>
    ${mood === 'fright' ? '<ellipse cx="0" cy="-314" rx="8" ry="11" fill="#3a2a1a"/>' : mood === 'cheer' ? '<path d="M-22 -320 Q0 -294 22 -320 Z" fill="#3a2a1a"/>' : '<path d="M-22 -318 Q0 -304 22 -318" stroke="#3a2a1a" stroke-width="3" fill="none" stroke-dasharray="5 4"/>'}`
  if (s.scarf) out += `<path d="M-40 -300 L40 -300 L0 -262 Z" fill="${CFG.colors.scarf}"/><circle cx="-6" cy="-292" r="3" fill="#ffffff"/><circle cx="10" cy="-290" r="3" fill="#ffffff"/>`
  const costume = costumeFor(occasion)
  if (costume.face !== undefined) out += costumeFace(costume.face, 15, -345)
  if (costume.hand !== undefined) out += handItem(costume.hand, 165, -292)
  if (costume.hat !== undefined) out += `<g transform="translate(0 -378)">${costumeHat(costume.hat)}</g>`
  else if (s.hat) out += `<ellipse cx="0" cy="-376" rx="80" ry="14" fill="#d9b44a"/><path d="M-40 -378 Q-38 -420 0 -422 Q38 -420 40 -378 Z" fill="#e3c25a"/><rect x="-40" y="-392" width="80" height="10" fill="${CFG.colors.hat}"/>`
  out += moodMarks(mood, -450)
  if (s.broom) out += `<g transform="translate(-120 -300)"><ellipse cx="0" cy="0" rx="18" ry="12" fill="#1f1f24"/><circle cx="14" cy="-12" r="9" fill="#1f1f24"/><path d="M22 -12 L32 -9 L22 -7 Z" fill="#e0a800"/><circle cx="16" cy="-14" r="2" fill="#ffffff"/><path d="M-16 2 L-30 8" stroke="#1f1f24" stroke-width="5"/></g>`
  return out
}

function easterDecor(): string {
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

/** Fable's weather: slowly twinkling sparkles and a shooting star now and then. */
function magicSky(rand: () => number): string {
  let out = ''
  for (let i = 0; i < 36; i++) {
    const x = Math.round(rand() * 1600)
    const y = Math.round(rand() * 560)
    const r = (5 + rand() * 7).toFixed(1)
    out += `<path class="spark" d="${starPath(x, y, Number(r), Number(r) * 0.28).replace(/(\d+\.\d)\d*/g, '$1')}" style="animation-delay:${(-rand() * 5).toFixed(1)}s"/>`
  }
  out += `<g class="shoot"><path d="M0 0 L-140 -46" class="trail"/><circle r="3.5" class="head"/></g>`
  return `<g class="magic">${out}</g>`
}

function womensDayDecor(): string {
  // Mimosa, the flower of the day, and a violet bunting.
  let bunting = ''
  for (let i = 0; i < 10; i++) {
    const x = 330 + i * 62
    const y = 110 + Math.round(Math.sin((i / 9) * Math.PI) * 46)
    bunting += `<path d="M${x - 16} ${y} L${x + 16} ${y} L${x} ${y + 34} Z" fill="${i % 2 === 0 ? '#7b3fa0' : '#b07ad0'}"/>`
  }
  let mimosa = ''
  const rand = seeded(8)
  for (let b = 0; b < 2; b++) {
    const bx = 860 + b * 230
    mimosa += `<path d="M${bx} 930 Q${bx + 10} 870 ${bx - 30} 820 M${bx + 4} 890 Q${bx + 50} 860 ${bx + 70} 820 M${bx + 2} 900 Q${bx - 50} 880 ${bx - 80} 860" stroke="#5a7d3a" stroke-width="5" fill="none"/>`
    for (let k = 0; k < 26; k++) {
      const x = bx - 85 + rand() * 160
      const y = 815 + rand() * 75
      mimosa += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(6 + rand() * 4).toFixed(1)}" fill="${k % 3 === 0 ? '#ffe14d' : '#ffd21f'}"/>`
    }
  }
  return `<path d="M300 92 Q620 180 940 92" stroke="#6b4f80" stroke-width="2" fill="none"/>${bunting}${mimosa}`
}

function labourDayDecor(): string {
  // A maypole with a wreath and ribbons swaying in the wind.
  const colors = ['#d52b1e', '#ffd54a', '#2f6a9a', '#3f7d55', '#ffffff', '#f49ab5']
  let ribbons = ''
  colors.forEach((c, i) => {
    const dx = (i - 2.5) * 22
    ribbons += `<path class="ribbon" d="M0 -300 Q${dx * 1.2} -200 ${dx * 2.4} -110" stroke="${c}" stroke-width="5" fill="none" style="animation-delay:${(i * 0.5).toFixed(1)}s"/>`
  })
  return `<g transform="translate(860 590)">
    <rect x="-5" y="-320" width="10" height="320" fill="#c9a35a"/>
    <path d="M-5 -280 L5 -270 M-5 -240 L5 -230 M-5 -200 L5 -190 M-5 -160 L5 -150 M-5 -120 L5 -110 M-5 -80 L5 -70" stroke="#8a5a2b" stroke-width="3"/>
    ${ribbons}
    <ellipse cx="0" cy="-300" rx="40" ry="12" fill="none" stroke="#3f7d3a" stroke-width="9"/>
    <circle cx="-30" cy="-302" r="5" fill="#ff6b6b"/><circle cx="0" cy="-289" r="5" fill="#ffd54a"/><circle cx="28" cy="-303" r="5" fill="#ffffff"/>
    <path d="M0 -320 L0 -352" stroke="#3f7d3a" stroke-width="6"/><circle cx="0" cy="-356" r="9" fill="#3f7d3a"/>
  </g>`
}

function pentecostDecor(): { sky: string; ground: string } {
  // A white dove gliding across the sky, and peonies in front.
  const dove = `<g class="dove"><g class="flap">
    <ellipse cx="0" cy="0" rx="30" ry="12" fill="#ffffff"/>
    <circle cx="28" cy="-6" r="9" fill="#ffffff"/><path d="M36 -6 L46 -3 L36 -1 Z" fill="#e0a800"/>
    <path d="M-30 -2 L-52 -12 L-50 6 Z" fill="#ffffff"/>
    <path class="wing" d="M-6 -4 Q-2 -44 22 -50 Q12 -22 10 -2 Z" fill="#f2f2f2"/>
  </g></g>`
  const peony = (x: number, y: number, c: string): string =>
    `<g transform="translate(${x} ${y})"><path d="M0 0 L0 40" stroke="#3f7d3a" stroke-width="4"/>
      <circle r="18" fill="${c}"/><circle cx="-10" cy="-6" r="11" fill="${c}"/><circle cx="10" cy="-6" r="11" fill="${c}"/><circle cy="-12" r="10" fill="${c}"/>
      <circle r="8" fill="#ffffff" opacity="0.35"/></g>`
  return { sky: dove, ground: `${peony(540, 880, '#f06fa0')}${peony(640, 900, '#f7a8c6')}${peony(1040, 885, '#e0457e')}${peony(1130, 905, '#f7a8c6')}` }
}

function halloweenDecor(): string {
  // Jack-o'-lanterns in front and bats gliding across the sky.
  const pumpkin = (x: number, y: number, size: number): string =>
    `<g transform="translate(${x} ${y}) scale(${size})">
      <ellipse cx="-16" cy="0" rx="22" ry="28" fill="#e8730c"/><ellipse cx="16" cy="0" rx="22" ry="28" fill="#e8730c"/><ellipse cx="0" cy="0" rx="22" ry="30" fill="#f08a1c"/>
      <path d="M0 -28 Q4 -40 12 -44" stroke="#4a6b2a" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path class="glow" d="M-20 -8 L-10 -18 L-4 -6 Z M20 -8 L10 -18 L4 -6 Z M-22 8 L-14 14 L-6 8 L0 16 L6 8 L14 14 L22 8 Q0 30 -22 8 Z"/>
    </g>`
  const bat = (i: number): string =>
    `<g class="bat" style="animation-delay:${(-i * 6.5).toFixed(1)}s"><g transform="translate(0 ${120 + i * 70})"><path class="batwing" d="M0 0 Q-10 -12 -26 -8 Q-18 -2 -22 6 Q-10 2 0 6 Q10 2 22 6 Q18 -2 26 -8 Q10 -12 0 0 Z" fill="#1f1a26"/></g></g>`
  return `${[0, 1, 2, 3].map(bat).join('')}${pumpkin(560, 890, 1.2)}${pumpkin(660, 915, 0.9)}${pumpkin(1060, 900, 1.1)}`
}


function heartPath(x: number, y: number, r: number): string {
  return `M${x} ${y + r * 0.9} C ${x - r * 1.6} ${y - r * 0.2} ${x - r * 0.7} ${y - r * 1.4} ${x} ${y - r * 0.5} C ${x + r * 0.7} ${y - r * 1.4} ${x + r * 1.6} ${y - r * 0.2} ${x} ${y + r * 0.9} Z`
}

function valentinesDecor(): string {
  // Hearts rising slowly from the meadow.
  const rand = seeded(14)
  let out = ''
  for (let i = 0; i < 12; i++) {
    const x = Math.round(380 + rand() * 900)
    const r = 9 + rand() * 9
    out += `<g transform="translate(${x} 900)"><path class="heart" d="${heartPath(0, 0, r)}" fill="${['#e0457e', '#f06fa0', '#c0392b'][i % 3] ?? '#e0457e'}" style="animation-delay:${(-rand() * 14).toFixed(1)}s"/></g>`
  }
  return out
}

function carnivalDecor(): string {
  // Confetti and streamers.
  const rand = seeded(19)
  const cols = ['#d52b1e', '#ffd54a', '#2f6a9a', '#3f7d55', '#f49ab5', '#b48cff']
  let out = ''
  for (let i = 0; i < 70; i++) {
    const x = Math.round(rand() * 1600)
    const y = Math.round(rand() * 1000)
    const dur = 12 + rand() * 8
    out += `<rect class="f f${i % 3}" x="${x}" y="${y}" width="7" height="4" fill="${cols[i % 6] ?? '#ffd54a'}" style="animation-duration:${dur.toFixed(1)}s;animation-delay:${(-rand() * dur).toFixed(1)}s"/>`
  }
  for (let i = 0; i < 6; i++) {
    const x = 470 + i * 120
    const y = 870 + (i % 2) * 30
    out += `<path d="M${x} ${y} q12 -18 24 0 t24 0 t24 0 t24 0" stroke="${cols[(i + 2) % 6] ?? '#d52b1e'}" stroke-width="4" fill="none" stroke-linecap="round"/>`
  }
  return out
}

function ascensionDecor(): string {
  // A hot-air balloon slowly rising: Auffahrt means ascent.
  return `<g class="balloon"><g transform="translate(980 430)">
    <path d="M-60 -70 Q-64 -160 0 -164 Q64 -160 60 -70 Q50 -30 16 -6 L-16 -6 Q-50 -30 -60 -70 Z" fill="#d52b1e"/>
    <path d="M-20 -162 Q-34 -90 -12 -6 M20 -162 Q34 -90 12 -6" stroke="#ffffff" stroke-width="10" fill="none"/>
    <path d="M-14 -4 L-12 20 M14 -4 L12 20" stroke="#6b4a2f" stroke-width="2"/>
    <rect x="-14" y="18" width="28" height="20" rx="3" fill="#8a5a2b"/>
  </g></g>`
}

function mothersDayDecor(): string {
  // A bed of tulips.
  let out = ''
  const cols = ['#e0457e', '#ffd54a', '#f06fa0', '#c0392b', '#b48cff']
  for (let i = 0; i < 9; i++) {
    const x = 860 + i * 34
    const y = 905 + (i % 2) * 14
    out += `<path d="M${x} ${y} L${x} ${y - 46}" stroke="#3f7d3a" stroke-width="4"/><path d="M${x} ${y - 20} Q${x + 18} ${y - 34} ${x + 14} ${y - 10} Z" fill="#3f7d3a"/>
      <path d="M${x - 11} ${y - 46} L${x - 11} ${y - 64} L${x - 4} ${y - 56} L${x} ${y - 68} L${x + 4} ${y - 56} L${x + 11} ${y - 64} L${x + 11} ${y - 46} Q${x} ${y - 36} ${x - 11} ${y - 46} Z" fill="${cols[i % 5] ?? '#e0457e'}"/>`
  }
  return out
}

function sechselaeutenDecor(): string {
  // The Böögg, a snowman on a pyre: the sooner its head bursts, the better the summer.
  return `<g transform="translate(900 640)">
    <path d="M-90 0 L-10 -150 L10 -150 L90 0 Z" fill="#a0784a"/>
    <path d="M-80 -10 L80 -10 M-64 -40 L64 -40 M-48 -70 L48 -70 M-32 -100 L32 -100 M-18 -128 L18 -128" stroke="#7a5230" stroke-width="5"/>
    <path class="fire" d="M-70 0 Q-80 -60 -40 -110 Q-36 -60 -14 -80 Q0 -40 20 -96 Q40 -50 50 -70 Q80 -40 70 0 Z" fill="#ff8c1a" opacity="0.85"/>
    <rect x="-3" y="-260" width="6" height="110" fill="#7a5230"/>
    <circle cx="0" cy="-190" r="30" fill="#ffffff" stroke="#c9d8e6" stroke-width="3"/>
    <circle cx="0" cy="-240" r="22" fill="#ffffff" stroke="#c9d8e6" stroke-width="3"/>
    <circle cx="-8" cy="-244" r="3" fill="#2b2b2b"/><circle cx="8" cy="-244" r="3" fill="#2b2b2b"/>
    <rect x="-16" y="-276" width="32" height="14" fill="#222222"/><rect x="-24" y="-264" width="48" height="5" fill="#222222"/>
  </g>`
}

function solsticeDecor(): string {
  // Sunflowers in front, fireflies in the warm night.
  const rand = seeded(23)
  let out = ''
  for (let i = 0; i < 5; i++) {
    const x = 860 + i * 70
    const y = 920
    let petals = ''
    for (let k = 0; k < 12; k++) {
      const a = (Math.PI * 2 * k) / 12
      petals += `<ellipse cx="${(x + Math.cos(a) * 18).toFixed(1)}" cy="${(y - 90 + Math.sin(a) * 18).toFixed(1)}" rx="9" ry="5" fill="#ffd21f" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${(x + Math.cos(a) * 18).toFixed(1)} ${(y - 90 + Math.sin(a) * 18).toFixed(1)})"/>`
    }
    out += `<path d="M${x} ${y} L${x} ${y - 80}" stroke="#3f7d3a" stroke-width="5"/>${petals}<circle cx="${x}" cy="${y - 90}" r="12" fill="#6b4423"/>`
  }
  for (let i = 0; i < 24; i++) {
    out += `<circle class="firefly" cx="${Math.round(200 + rand() * 1200)}" cy="${Math.round(560 + rand() * 300)}" r="3" style="animation-delay:${(-rand() * 6).toFixed(1)}s"/>`
  }
  return out
}

function stNicholasDecor(): string {
  // A sack with mandarins, nuts and gingerbread, and a bundle of twigs.
  return `<g transform="translate(600 880)">
    <path d="M-40 0 Q-50 -50 -20 -70 L20 -70 Q50 -50 40 0 Z" fill="#8a6a3a"/>
    <path d="M-22 -70 Q0 -60 22 -70" stroke="#5a4020" stroke-width="5" fill="none"/>
    <circle cx="-10" cy="-78" r="10" fill="#f08a1c"/><circle cx="10" cy="-80" r="9" fill="#f5a03a"/><circle cx="0" cy="-90" r="7" fill="#8a5a2b"/>
    <circle cx="62" cy="-6" r="10" fill="#f08a1c"/><circle cx="80" cy="-4" r="7" fill="#8a5a2b"/><circle cx="92" cy="-6" r="6" fill="#a0784a"/>
    <path d="M-80 0 L-96 -110 M-76 0 L-84 -114 M-72 0 L-72 -112" stroke="#5a4020" stroke-width="3"/><path d="M-88 -30 L-68 -30" stroke="#c0392b" stroke-width="5"/>
  </g>`
}

// ── the whole scene ──────────────────────────────────────────────────────

export function buildScene(input: SceneInput): string {
  const p = clamp(input.percent, 0, 100)
  const y = yearState(input.date, input.occasion)
  const rand = seeded(7)
  const clicked = input.click !== undefined
  const gl = ground('light', y)
  const gd = ground('dark', y)
  const sky = SKY[input.weather]

  let figure: string
  if (y.figure === 'snowman') {
    figure = snowman(y, p, input.mood)
  } else if (y.figure === 'remains') {
    figure = remains(p)
  } else {
    figure = scarecrow(p, input.mood, y.occasion)
  }
  const scale = clamp(CFG.figureSize, 0.6, 1.6).toFixed(2)

  let extras = ''
  let sky2 = ''
  const magic = input.weather === 'magic' ? magicSky(seeded(31)) : ''
  if (y.occasion === 'easter') extras += easterDecor()
  if (y.occasion === 'womensDay') extras += womensDayDecor()
  if (y.occasion === 'valentinesDay') extras += valentinesDecor()
  if (y.occasion === 'carnival') extras += carnivalDecor()
  if (y.occasion === 'ascension') sky2 += ascensionDecor()
  if (y.occasion === 'mothersDay') extras += mothersDayDecor()
  if (y.occasion === 'sechselaeuten') extras += sechselaeutenDecor()
  if (y.occasion === 'solstice') extras += solsticeDecor()
  if (y.occasion === 'stNicholas') extras += stNicholasDecor()
  if (y.occasion === 'labourDay') extras += labourDayDecor()
  if (y.occasion === 'pentecost') {
    const p2 = pentecostDecor()
    sky2 += p2.sky
    extras += p2.ground
  }
  if (y.occasion === 'halloween') {
    extras += halloweenDecor()
  }
  if (y.occasion === 'swissNationalDay') {
    extras += swissDay()
    sky2 += fireworks(['#d52b1e', '#ffffff', '#ff6b6b'], seeded(3))
  }
  if (y.occasion === 'newYearsEve' || y.occasion === 'newYear') {
    sky2 += fireworks(['#ffd54a', '#6bc5ff', '#ff6b6b', '#8cff8c', '#ffffff'], seeded(5))
  }
  if (y.occasion === 'christmas') extras += presents()

  const greeting = y.occasion === 'newYear' ? `<text x="800" y="90" text-anchor="middle" class="greet">${escapeXml(t().newYearGreeting)}</text>` : ''

  const label = escapeXml(input.modelLabel || t().loadingModel)
  const sub = escapeXml(`${t().contextShare(Math.round(p))} · ${y.occasion ? t().occasions[y.occasion] : t().seasons[y.season]}`)
  // The label is drawn in screen pixels, so it keeps its size and corner on any window.
  const pillW = Math.round(Math.max(200, 40 + Math.max(label.length * 12.5, sub.length * 7.6)))
  const right = CFG.label.position !== 'top-left'
  const pillX = right ? -CFG.label.offsetX - pillW : CFG.label.offsetX
  const pillY = CFG.label.offsetY

  const fog =
    input.weather === 'fog'
      ? `<g class="fogs" filter="url(#soft)"><rect class="fog fog1" x="-400" y="520" width="2400" height="120" rx="60"/><rect class="fog fog2" x="-400" y="640" width="2400" height="140" rx="70"/><rect class="fog fog1" x="-400" y="400" width="2400" height="90" rx="45"/></g>`
      : ''
  const aurora =
    input.weather === 'sunset'
      ? `<g class="aurora"><path d="M-200 200 C 100 90 600 260 900 140 C 1150 50 1500 210 1800 120 L1800 230 C 1500 310 1150 150 900 240 C 600 360 100 190 -200 300 Z"/></g>`
      : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
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
  .hop { animation: hop 0.7s ease-out 4; }
  .jolt { animation: jolt 1.2s ease-out 1; }
  .hatpop { animation: hatpop 1.2s ease-out 1; }
  .confetti { animation: confetti 2.4s ease-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
  .bang { animation: fadein 0.3s ease-out both; }
  .skytop { fill: ${sky.light[0]}; }
  .spark { fill: #fff6c8; opacity: 0.3; animation: twinkle 5s ease-in-out infinite; }
  .shoot { opacity: 0; animation: shoot 11s linear infinite; }
  .trail { stroke: #ffffff; stroke-width: 2.5; stroke-linecap: round; opacity: 0.8; }
  .head { fill: #ffffff; }
  .ribbon { animation: sway 5s ease-in-out infinite; transform-box: view-box; transform-origin: 0px -300px; }
  .dove { animation: dove 26s linear infinite; }
  .flap .wing { animation: flap 1.4s ease-in-out infinite; transform-box: fill-box; transform-origin: 20% 100%; }
  .bat { animation: bat 26s linear infinite; }
  .batwing { animation: flap 0.9s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 60%; }
  .glow { fill: #5a2a00; }
  .heart { animation: rise 16s ease-in-out infinite; opacity: 0; }
  .balloon { animation: balloon 40s ease-in-out infinite alternate; }
  .firefly { fill: #fff27a; opacity: 0; animation: firefly 6s ease-in-out infinite; }
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
  @keyframes hop { 0%, 100% { transform: translate(0px, 0px); } 40% { transform: translate(0px, -46px); } 70% { transform: translate(0px, 0px) scale(1.04, 0.96); } }
  @keyframes jolt { 0% { transform: translate(0px, 0px); } 12% { transform: translate(0px, -34px); } 24% { transform: translate(0px, 0px); } 36% { transform: translate(-6px, 0px); } 48% { transform: translate(6px, 0px); } 60% { transform: translate(-4px, 0px); } 72% { transform: translate(4px, 0px); } 100% { transform: translate(0px, 0px); } }
  @keyframes hatpop { 0% { transform: translate(0px, 0px); } 18% { transform: translate(0px, -40px); } 40% { transform: translate(0px, -12px); } 100% { transform: translate(0px, -12px); } }
  @keyframes confetti { 0% { transform: translate(0px, 0px) rotate(0deg); opacity: 1; } 100% { transform: translate(0px, 60px) rotate(300deg); opacity: 0.2; } }
  @keyframes twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
  @keyframes shoot { 0% { opacity: 0; transform: translate(300px, 80px); } 4% { opacity: 1; } 12% { opacity: 0; transform: translate(760px, 230px); } 100% { opacity: 0; transform: translate(760px, 230px); } }
  @keyframes dove { from { transform: translate(-120px, 260px); } 50% { transform: translate(800px, 180px); } to { transform: translate(1750px, 240px); } }
  @keyframes bat { from { transform: translate(-80px, 0px); } 25% { transform: translate(400px, 40px); } 50% { transform: translate(800px, -20px); } 75% { transform: translate(1200px, 30px); } to { transform: translate(1700px, 0px); } }
  @keyframes flap { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.35); } }
  @keyframes rise { 0% { opacity: 0; transform: translate(0px, 0px); } 10% { opacity: 0.9; } 90% { opacity: 0.6; } 100% { opacity: 0; transform: translate(30px, -620px); } }
  @keyframes balloon { from { transform: translate(0px, 60px); } to { transform: translate(-120px, -320px); } }
  @keyframes firefly { 0%, 100% { opacity: 0; transform: translate(0px, 0px); } 50% { opacity: 0.25; transform: translate(14px, -10px); } }
  @keyframes drift { from { transform: translate(-120px, 0px); } to { transform: translate(120px, 0px); } }
  @media (prefers-color-scheme: dark) {
    .sky0 { stop-color: ${sky.dark[0]}; } .sky1 { stop-color: ${sky.dark[1]}; } .sky2 { stop-color: ${sky.dark[2]}; }
    .far { fill: ${gd.far}; } .near { fill: ${gd.near}; } .ground { fill: ${gd.ground}; }
    .pine { fill: #1d3b36; } .pine2 { fill: #16302c; } .cap { fill: #c9d8e8; }
    .snowball { fill: #e8eef6; stroke: #9fb3c9; }
    .puddle { fill: #5f86a8; }
    .stars { opacity: ${input.weather === 'clear' ? 0.8 : 0.3}; }
    .sun { opacity: 0; } .moon { opacity: 1; }
    .s { stroke: none; } .clump, .gs { stroke: none; }
    .fluff { fill: #fff7a8; stroke: none; }
    .fireworks { opacity: 1; }
    .fog { fill: #9fb0c2; opacity: 0.25; }
    .aurora path { opacity: 0.45; animation: drift 40s ease-in-out infinite alternate; }
    .wing { stroke: #c9d8e8; }
    .greet { fill: #ffd54a; }
    .skytop { fill: ${sky.dark[0]}; }
    .glow { fill: #ffcf4a; }
    .spark { fill: #fff3a0; }
    @keyframes firefly { 0%, 100% { opacity: 0.1; transform: translate(0px, 0px); } 50% { opacity: 1; transform: translate(14px, -10px); } }
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
<!-- landscape, filling the window -->
<svg width="100%" height="100%" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice">
<rect x="-2000" y="-2000" width="5600" height="5000" class="skytop"/>
<rect width="1600" height="1000" fill="url(#sky)"/>
${stars(seeded(11))}
${aurora}
${magic}
<g ${input.weather === 'fog' ? 'opacity="0.45"' : ''}>${celestial(clicked)}</g>
${sky2}
${greeting}
<!-- hills -->
<path class="far" d="M0 640 C 220 560 420 600 640 570 C 880 535 1100 600 1320 560 C 1450 540 1530 560 1600 575 L1600 1000 L0 1000 Z"/>
${pines(y, y.occasion, clicked, seeded(21))}
<path class="near" d="M0 740 C 260 690 520 720 800 700 C 1080 680 1320 730 1600 705 L1600 1000 L0 1000 Z"/>
<path class="ground" d="M0 840 C 300 815 700 835 1000 822 C 1250 812 1450 830 1600 825 L1600 1000 L0 1000 Z"/>
${fog}
${extras}
</svg>
<!-- figure, pinned bottom left -->
<svg width="100%" height="100%" viewBox="0 0 700 1000" preserveAspectRatio="xMinYMax meet">
  <g transform="translate(290 860) scale(${scale})"><g class="${input.mood === 'cheer' ? 'hop' : input.mood === 'fright' ? 'jolt' : ''}">${figure}</g></g>
</svg>
<!-- falling things, in front of the figure -->
<svg width="100%" height="100%" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice">
<g>${particles(y, p, rand)}</g>
${input.click ? `<g>${gust(y, input.click, seeded(input.click.seq + 101))}</g>` : ''}
</svg>
<!-- label, pinned to a top corner in screen pixels -->
<svg x="${right ? '100%' : '0'}" y="0" width="1" height="1" overflow="visible">
  <rect class="pill" x="${pillX}" y="${pillY}" width="${pillW}" height="72" rx="16"/>
  <text class="lbl" x="${pillX + 20}" y="${pillY + 34}">${label}</text>
  <text class="sub" x="${pillX + 20}" y="${pillY + 58}">${sub}</text>
</svg>
</svg>`
}
