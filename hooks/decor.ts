// Decorations for the occasions added for other regions and cultures, and the
// building blocks they share (bunting, lanterns, fireworks, a bonfire). All in
// the landscape's units: 1600 wide, 1000 high, the meadow from y 850 down.
//
// Respectful by design: lights, lanterns, flowers and patterns; no religious
// figures and nothing that caricatures a custom.

export type ParticleKind = 'shamrock' | 'petal' | 'leaf' | 'colour'

/** What an occasion adds to the scene. */
export type DecorResult = {
  /** Behind the hills (sky, far away). */
  sky?: string
  /** On the meadow, behind the figure. */
  ground?: string
  /** Falling things are replaced by these. */
  particles?: ParticleKind
  /** A colour laid thinly over the landscape. */
  tint?: string
  /** How the moon looks. */
  moon?: 'crescent' | 'big'
  /** Lights on the tallest fir tree; christmas adds a star. */
  treeLights?: 'advent' | 'christmas'
}

export function seeded(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function starPath(cx: number, cy: number, r1: number, r2: number): string {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? r1 : r2
    const a = (Math.PI / 5) * i - Math.PI / 2
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)} `
  }
  return d + 'Z'
}

/** Slow bursts of dots, a few seconds apart, in the given colours. */
export function fireworks(palette: string[], rand: () => number): string {
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

/** A string of triangular pennants across the sky, in a country's colours. */
export function bunting(colors: string[], from = 300, to = 1000, y = 100): string {
  const count = 11
  let flags = ''
  for (let i = 0; i < count; i++) {
    const x = from + ((to - from) * i) / (count - 1)
    const sag = Math.round(Math.sin((i / (count - 1)) * Math.PI) * 46)
    flags += `<path d="M${(x - 15).toFixed(0)} ${y + sag} L${(x + 15).toFixed(0)} ${y + sag} L${x.toFixed(0)} ${y + sag + 34} Z" fill="${colors[i % colors.length] ?? '#ffffff'}" stroke="#00000022" stroke-width="1"/>`
  }
  return `<path d="M${from - 30} ${y - 8} Q${(from + to) / 2} ${y + 90} ${to + 30} ${y - 8}" stroke="#55555588" stroke-width="2" fill="none"/>${flags}`
}

/** Round paper lanterns hanging on a line; darkOnly hides them by day. */
export function lanterns(colors: string[], opts: { from?: number; to?: number; y?: number; darkOnly?: boolean } = {}): string {
  const from = opts.from ?? 420
  const to = opts.to ?? 1080
  const y = opts.y ?? 120
  const count = 9
  let out = ''
  for (let i = 0; i < count; i++) {
    const x = from + ((to - from) * i) / (count - 1)
    const sag = Math.round(Math.sin((i / (count - 1)) * Math.PI) * 50)
    const c = colors[i % colors.length] ?? '#d52b1e'
    out += `<g transform="translate(${x.toFixed(0)} ${y + sag})"><path d="M0 -14 L0 -6" stroke="#555555" stroke-width="2"/>
      <ellipse rx="14" ry="17" fill="${c}" class="lantern" style="animation-delay:${(i * 0.4).toFixed(1)}s"/>
      <ellipse rx="14" ry="17" fill="#ffd54a" class="shine"/>
      <rect x="-6" y="15" width="12" height="4" fill="#555555"/></g>`
  }
  return `<g class="${opts.darkOnly ? 'darkonly' : ''}"><path d="M${from - 30} ${y - 22} Q${(from + to) / 2} ${y + 80} ${to + 30} ${y - 22}" stroke="#555555" stroke-width="2" fill="none"/>${out}</g>`
}

/** A small bonfire on the meadow. */
export function bonfire(x: number, y: number, scale = 1): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-26 6 L26 -4 M-24 -4 L26 6" stroke="#6b4423" stroke-width="7" stroke-linecap="round"/>
    <path class="fire" d="M-20 0 Q-22 -30 -4 -52 Q-2 -30 8 -40 Q18 -22 20 0 Z" fill="#ff8c1a"/>
    <path class="fire" d="M-10 0 Q-10 -18 0 -30 Q6 -16 10 0 Z" fill="#ffd54a"/>
  </g>`
}

/** A candle with a gently moving flame; lit or not. */
function candle(x: number, y: number, color: string, height = 34, lit = true): string {
  return `<rect x="${x - 4}" y="${y - height}" width="8" height="${height}" rx="2" fill="${color}"/>
    ${lit ? `<path class="flame" d="M${x} ${y - height - 16} Q${x + 6} ${y - height - 6} ${x} ${y - height - 1} Q${x - 6} ${y - height - 6} ${x} ${y - height - 16} Z" fill="#ffcc33"/>` : ''}`
}

/** Plain pumpkins, for harvest festivals. */
function pumpkins(): string {
  const one = (x: number, y: number, s: number): string => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="-16" cy="0" rx="22" ry="26" fill="#e8730c"/><ellipse cx="16" cy="0" rx="22" ry="26" fill="#e8730c"/><ellipse cx="0" cy="0" rx="22" ry="28" fill="#f08a1c"/>
    <path d="M0 -26 Q4 -38 12 -42" stroke="#4a6b2a" stroke-width="5" fill="none" stroke-linecap="round"/></g>`
  return one(560, 900, 1.1) + one(640, 918, 0.8) + one(1040, 905, 1.2) + one(1120, 925, 0.9)
}

// ── national days ─────────────────────────────────────────────────────────

/** A national day: bunting in the country's colours and fireworks in them. */
export function nationalDayDecor(colors: string[], seed: number): DecorResult {
  return { sky: bunting(colors) + fireworks(colors, seeded(seed)) }
}

export const NATIONAL_COLORS: Record<string, string[]> = {
  germanUnityDay: ['#000000', '#dd0000', '#ffce00'],
  austrianNationalDay: ['#c8102e', '#ffffff', '#c8102e'],
  liechtensteinNationalDay: ['#002b7f', '#ce1126'],
  bastilleDay: ['#0055a4', '#ffffff', '#ef4135'],
  italianRepublicDay: ['#009246', '#ffffff', '#ce2b37'],
  spanishNationalDay: ['#aa151b', '#f1bf00'],
  kingsDay: ['#ff7f00', '#ff9a1f', '#ffffff'],
  independenceDayUS: ['#b22234', '#ffffff', '#3c3b6e'],
  canadaDay: ['#d80621', '#ffffff'],
  mexicanIndependenceDay: ['#006847', '#ffffff', '#ce1126'],
  brazilIndependenceDay: ['#009c3b', '#ffdf00'],
  australiaDay: ['#00843d', '#ffcd00'],
  waitangiDay: ['#000000', '#ffffff', '#cc142b'],
  indianIndependenceDay: ['#ff9933', '#ffffff', '#138808'],
  polishIndependenceDay: ['#ffffff', '#dc143c'],
  ukrainianIndependenceDay: ['#0057b7', '#ffd700'],
  constitutionDayNO: ['#ba0c2f', '#ffffff', '#00205b'],
}

// ── other occasions ───────────────────────────────────────────────────────

function epiphany(): DecorResult {
  // A bright star with a tail.
  return { sky: `<g class="comet"><path d="M820 150 L560 260" stroke="#fff3b0" stroke-width="5" stroke-linecap="round" opacity="0.6"/><path class="xstar" d="${starPath(830, 145, 22, 9)}"/></g>` }
}

function stPatricksDay(): DecorResult {
  let clover = ''
  for (const [x, y] of [[520, 905], [600, 925], [1060, 900], [1140, 922]] as const) {
    clover += `<g transform="translate(${x} ${y})"><circle cx="-7" cy="-6" r="8" fill="#2e8b3e"/><circle cx="7" cy="-6" r="8" fill="#2e8b3e"/><circle cx="0" cy="-17" r="8" fill="#2e8b3e"/><path d="M0 -4 Q2 8 6 14" stroke="#2e6b2e" stroke-width="3" fill="none"/></g>`
  }
  return { particles: 'shamrock', ground: clover }
}

function stMartin(): DecorResult {
  // Paper lanterns carried on sticks in a row, as in the lantern walks.
  let out = ''
  const cols = ['#ffb347', '#ff6b6b', '#ffd54a', '#7ec8e3', '#b48cff']
  for (let i = 0; i < 6; i++) {
    const x = 470 + i * 110
    const y = 820 + (i % 2) * 18
    out += `<path d="M${x} ${y + 70} L${x} ${y - 10} Q${x + 14} ${y - 24} ${x + 26} ${y - 14}" stroke="#6b4a2f" stroke-width="3" fill="none"/>
      <g transform="translate(${x + 26} ${y + 4})"><ellipse rx="15" ry="18" fill="${cols[i % 5] ?? '#ffb347'}"/><ellipse rx="15" ry="18" fill="#ffe28a" class="shine"/></g>`
  }
  return { ground: out }
}

function midsummerDecor(): DecorResult {
  // A midsummer pole hung with leaves and flowers.
  return {
    ground: `<g transform="translate(880 600)">
      <rect x="-5" y="-300" width="10" height="300" fill="#8a5a2b"/>
      <rect x="-90" y="-250" width="180" height="9" fill="#8a5a2b"/>
      <circle cx="-90" cy="-200" r="34" fill="none" stroke="#3f7d3a" stroke-width="10"/>
      <circle cx="90" cy="-200" r="34" fill="none" stroke="#3f7d3a" stroke-width="10"/>
      <path d="M-5 -300 Q-30 -150 -5 0 M5 -300 Q30 -150 5 0" stroke="#4f8f45" stroke-width="7" fill="none"/>
      <circle cx="-120" cy="-205" r="5" fill="#ffd54a"/><circle cx="-60" cy="-190" r="5" fill="#f49ab5"/><circle cx="60" cy="-190" r="5" fill="#ffffff"/><circle cx="120" cy="-205" r="5" fill="#b48cff"/>
    </g>`,
  }
}

function thanksgiving(): DecorResult {
  return { ground: pumpkins(), particles: 'leaf' }
}

function guyFawkesNight(): DecorResult {
  return { sky: fireworks(['#ffd54a', '#ff6b6b', '#ffffff', '#6bc5ff'], seeded(41)), ground: bonfire(700, 600, 1.4) }
}

function dayOfTheDead(): DecorResult {
  // Marigold garland and candles: a warm welcome, not a fright.
  let marigolds = ''
  for (let i = 0; i < 22; i++) {
    const x = 330 + i * 32
    const y = 110 + Math.round(Math.sin((i / 21) * Math.PI) * 50)
    marigolds += `<circle cx="${x}" cy="${y}" r="11" fill="${i % 2 ? '#ff9f1c' : '#ffbf1f'}"/><circle cx="${x}" cy="${y}" r="5" fill="#e07000"/>`
  }
  const picado = bunting(['#e0457e', '#ff9f1c', '#6bc5ff', '#8cd17d', '#b48cff'], 360, 1000, 190)
  let candles = ''
  for (let i = 0; i < 6; i++) candles += candle(600 + i * 70, 905 + (i % 2) * 10, '#f4e3c3', 28 + (i % 3) * 8)
  return { sky: `<path d="M300 100 Q660 190 1040 100" stroke="#8a5a2b" stroke-width="2" fill="none"/>${marigolds}${picado}`, ground: candles }
}

function childrensDay(): DecorResult {
  // Koinobori: carp streamers on a pole.
  const carp = (y: number, color: string, len: number): string =>
    `<g transform="translate(0 ${y})"><g class="koi"><path d="M0 0 Q${len * 0.5} -18 ${len} -4 L${len + 22} -16 L${len + 14} 0 L${len + 22} 16 L${len} 4 Q${len * 0.5} 18 0 0 Z" fill="${color}"/>
      <circle cx="16" cy="-2" r="6" fill="#ffffff"/><circle cx="16" cy="-2" r="3" fill="#1f1f24"/></g></g>`
  return {
    ground: `<g transform="translate(900 600)"><rect x="-4" y="-330" width="8" height="330" fill="#c9a35a"/><circle cx="0" cy="-336" r="9" fill="#ffd54a"/>
      <g transform="translate(4 -300)">${carp(0, '#1f3a66', 150)}${carp(46, '#d52b1e', 120)}${carp(88, '#3fa0d0', 96)}</g></g>`,
  }
}

function tanabata(): DecorResult {
  // Bamboo with paper wishes.
  const cols = ['#ff6b6b', '#ffd54a', '#6bc5ff', '#8cd17d', '#b48cff', '#f49ab5']
  let strips = ''
  for (let i = 0; i < 12; i++) {
    const x = 860 + ((i * 37) % 120) - 50
    const y = 340 + i * 18
    strips += `<rect class="ribbon" x="${x}" y="${y}" width="10" height="34" fill="${cols[i % 6] ?? '#ffd54a'}" style="animation-delay:${(i * 0.3).toFixed(1)}s"/>`
  }
  return {
    ground: `<path d="M870 600 Q860 420 880 300" stroke="#5a8f3a" stroke-width="10" fill="none"/><path d="M866 470 Q820 430 790 420 M872 400 Q930 360 960 360 M876 340 Q840 300 820 296" stroke="#5a8f3a" stroke-width="5" fill="none"/>${strips}`,
  }
}

function lunarNewYear(): DecorResult {
  return { sky: lanterns(['#d52b1e', '#c0392b', '#e74c3c']) + fireworks(['#d52b1e', '#ffd54a', '#ff6b6b'], seeded(51)) }
}

function midAutumn(): DecorResult {
  return { sky: lanterns(['#ff9f1c', '#d52b1e', '#ffd54a', '#e0457e'], { y: 160 }), moon: 'big' }
}

function nowruz(): DecorResult {
  // Blossom on a branch, and sabzeh (sprouted wheat) in a bowl.
  let blossoms = ''
  const rand = seeded(61)
  for (let i = 0; i < 18; i++) blossoms += `<circle cx="${(1000 + rand() * 180).toFixed(0)}" cy="${(170 + rand() * 90).toFixed(0)}" r="${(6 + rand() * 4).toFixed(1)}" fill="${i % 3 ? '#f7b6c8' : '#ffffff'}"/>`
  let blades = ''
  for (let i = 0; i < 14; i++) blades += `<path d="M${640 + i * 6} 880 Q${636 + i * 6} 850 ${642 + i * 6 + ((i % 3) - 1) * 6} 826" stroke="#5aa83a" stroke-width="3" fill="none"/>`
  return {
    sky: `<path d="M1260 150 Q1120 190 990 260" stroke="#6b4a2f" stroke-width="6" fill="none"/>${blossoms}`,
    ground: `${blades}<path d="M620 878 L740 878 Q735 910 680 912 Q625 910 620 878 Z" fill="#c0392b"/><path d="M640 870 Q690 850 720 870" stroke="#d52b1e" stroke-width="4" fill="none"/>`,
  }
}

function ramadan(): DecorResult {
  return { sky: lanterns(['#ffd54a', '#2f8f83', '#ffb347'], { darkOnly: true }), moon: 'crescent' }
}

function eidAlFitr(): DecorResult {
  let lights = ''
  for (let i = 0; i < 20; i++) lights += `<circle cx="${380 + i * 36}" cy="${220 + Math.round(Math.sin((i / 19) * Math.PI) * 36)}" r="4.5" fill="#ffe28a" class="bulb" style="animation-delay:${((i % 5) * 0.6).toFixed(1)}s"/>`
  return { sky: lanterns(['#ffd54a', '#2f8f83', '#e0457e']) + `<path d="M360 214 Q740 290 1100 214" stroke="#55555588" stroke-width="2" fill="none"/>${lights}`, moon: 'crescent' }
}

function eidAlAdha(): DecorResult {
  let stars = ''
  const rand = seeded(71)
  for (let i = 0; i < 9; i++) stars += `<path class="xstar" d="${starPath(Math.round(380 + rand() * 760), Math.round(200 + rand() * 120), 10, 4)}"/>`
  return { sky: lanterns(['#ffd54a', '#2f6a9a', '#ffb347']) + stars, moon: 'crescent' }
}

function hanukkah(dayIndex: number): DecorResult {
  // Nine candles in a row; one more is lit each evening, with the helper candle in the middle.
  const lit = Math.min(8, dayIndex + 1)
  let out = `<rect x="640" y="900" width="300" height="10" rx="4" fill="#c9a35a"/>`
  for (let i = 0; i < 9; i++) {
    const x = 660 + i * 32
    const helper = i === 4
    const branch = i < 4 ? 8 - i : 8 - (i - 1) // light from the right, one more each evening
    out += candle(x, helper ? 880 : 900, '#6bc5ff', helper ? 44 : 34, helper || branch <= lit)
  }
  return { ground: out }
}

function diwali(): DecorResult {
  // Diyas (clay oil lamps) and a rangoli pattern on the ground.
  let diyas = ''
  for (let i = 0; i < 8; i++) {
    const x = 470 + i * 95
    const y = 900 + (i % 2) * 14
    diyas += `<path d="M${x - 16} ${y} Q${x} ${y + 14} ${x + 16} ${y} Z" fill="#b5651d"/><path class="flame" d="M${x} ${y - 18} Q${x + 6} ${y - 8} ${x} ${y - 2} Q${x - 6} ${y - 8} ${x} ${y - 18} Z" fill="#ffcc33"/>`
  }
  let rangoli = ''
  const cols = ['#e0457e', '#ff9f1c', '#ffd54a', '#2f8f83', '#6b4fbb']
  for (let ring = 0; ring < 4; ring++) {
    const r = 18 + ring * 14
    for (let k = 0; k < 12; k++) {
      const a = (Math.PI * 2 * k) / 12 + ring * 0.26
      rangoli += `<ellipse cx="${(820 + Math.cos(a) * r).toFixed(0)}" cy="${(930 + Math.sin(a) * r * 0.35).toFixed(0)}" rx="7" ry="3" fill="${cols[(ring + k) % 5] ?? '#ffd54a'}"/>`
    }
  }
  return { ground: rangoli + diyas, sky: lanterns(['#ffd54a', '#ff9f1c', '#e0457e'], { darkOnly: true }) }
}

function vesak(): DecorResult {
  let lotus = ''
  for (const [x, y] of [[560, 905], [700, 925], [1060, 910]] as const) {
    lotus += `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="8" rx="34" ry="8" fill="#3f7d55"/>
      <path d="M0 0 Q-10 -18 0 -30 Q10 -18 0 0 Z M0 0 Q-24 -10 -22 -24 Q-8 -14 0 0 Z M0 0 Q24 -10 22 -24 Q8 -14 0 0 Z" fill="#f7b6c8" stroke="#e0457e" stroke-width="1"/></g>`
  }
  return { sky: lanterns(['#ffffff', '#ffe28a', '#f7b6c8']), ground: lotus }
}

function kwanzaa(): DecorResult {
  // Seven candles: three red, one black in the middle, three green.
  const colors = ['#c0392b', '#c0392b', '#c0392b', '#1f1f24', '#2e8b3e', '#2e8b3e', '#2e8b3e']
  let out = `<rect x="690" y="900" width="230" height="12" rx="4" fill="#6b4a2f"/>`
  colors.forEach((c, i) => {
    out += candle(705 + i * 33, 900, c, 34)
  })
  return { ground: out }
}

/** Decorations for occasions this file draws; undefined for the ones the scene draws itself. */
export function regionalDecor(id: string, dayIndex: number): DecorResult | undefined {
  const colors = NATIONAL_COLORS[id]
  if (colors) {
    const result = nationalDayDecor(colors, id.length * 7)
    return id === 'kingsDay' ? { ...result, tint: '#ff7f00' } : result
  }
  switch (id) {
    case 'epiphany':
      return epiphany()
    case 'stPatricksDay':
      return stPatricksDay()
    case 'stMartin':
      return stMartin()
    case 'stLucia':
      return { treeLights: 'advent', sky: lanterns(['#fff3c4'], { darkOnly: true }) }
    case 'midsummer':
      return midsummerDecor()
    case 'thanksgiving':
      return thanksgiving()
    case 'guyFawkesNight':
      return guyFawkesNight()
    case 'dayOfTheDead':
      return dayOfTheDead()
    case 'childrensDay':
      return childrensDay()
    case 'tanabata':
      return tanabata()
    case 'hanami':
      return { particles: 'petal' }
    case 'lunarNewYear':
      return lunarNewYear()
    case 'midAutumn':
      return midAutumn()
    case 'nowruz':
      return nowruz()
    case 'ramadan':
      return ramadan()
    case 'eidAlFitr':
      return eidAlFitr()
    case 'eidAlAdha':
      return eidAlAdha()
    case 'hanukkah':
      return hanukkah(dayIndex)
    case 'diwali':
      return diwali()
    case 'holi':
      return { particles: 'colour' }
    case 'vesak':
      return vesak()
    case 'kwanzaa':
      return kwanzaa()
    default:
      return undefined
  }
}
