// Which occasion falls on a day, as data: each occasion lists the regions it
// is shown in, the days it covers in a year, and a priority for days on which
// several fall together. occasionOn() and occasionStart() only read this table.

import type { Hemisphere } from './detect.js'
import type { Occasion } from './i18n.js'

export type DateParts = { y: number; m: number; d: number }

/** What decides which occasions apply: where the person is, and what they switched on or off. */
export type OccasionContext = {
  region: string
  subdivision: string
  hemisphere: Hemisphere
  /** Per occasion: false hides it, true shows one that is off by default. */
  enabled: Partial<Record<string, boolean>>
  /** Occasions shown whatever the region. */
  extra: readonly string[]
}

/** Inclusive range of day numbers (days since 1970-01-01). */
export type DayRange = [from: number, to: number]

export type DecorKey = Occasion
export type CostumeKey = 'witch' | 'santa' | 'mitre' | 'bunny' | 'party' | 'jester' | 'flag' | 'rose' | 'bouquet' | 'mimosa' | 'sunglasses'

export type OccasionDef = {
  id: Occasion
  /** ISO 3166 countries or ISO 3166-2 subdivisions, or 'global'. */
  regions: readonly string[] | 'global'
  /** The days the occasion covers in year y (a list, as lunar dates can fall twice in one year). */
  days: (y: number, ctx: OccasionContext) => DayRange[] | undefined
  /** The higher wins when several occasions fall on the same day. */
  priority: number
  /** Shown only when switched on in the settings. */
  offByDefault?: boolean
  decor?: DecorKey
  costume?: CostumeKey
}

// ── date helpers ──────────────────────────────────────────────────────────

export function dayNumber(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

export function fromDayNumber(n: number): DateParts {
  const t = new Date(n * 86400000)
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}

/** Western (Gregorian) Easter Sunday, by the anonymous Gregorian computus. */
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

/**
 * Orthodox Easter Sunday: the Julian computus (Meeus), moved to the Gregorian
 * calendar, which runs 13 days ahead from 1900 to 2099.
 */
export function orthodoxEaster(y: number): DateParts {
  const a = y % 4
  const b = y % 7
  const c = y % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = Math.floor((d + e + 114) / 31)
  const day = ((d + e + 114) % 31) + 1
  return fromDayNumber(dayNumber(y, month, day) + 13)
}

function easterDay(y: number): number {
  const e = easterSunday(y)
  return dayNumber(e.y, e.m, e.d)
}

/** The day number of the nth weekday (0 = Sunday) of a month. */
export function nthWeekday(y: number, m: number, weekday: number, n: number): number {
  const first = dayNumber(y, m, 1)
  const firstWeekday = new Date(first * 86400000).getUTCDay()
  return first + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7
}

/** The day number of the last weekday (0 = Sunday) of a month. */
export function lastWeekday(y: number, m: number, weekday: number): number {
  const last = dayNumber(y, m + 1, 1) - 1
  const lastWeekdayOfMonth = new Date(last * 86400000).getUTCDay()
  return last - ((lastWeekdayOfMonth - weekday + 7) % 7)
}

export function weekdayOf(n: number): number {
  return new Date(n * 86400000).getUTCDay()
}

const calendarCache = new Map<string, number[]>()

/**
 * The days in Gregorian year y on which another calendar shows the given month
 * and day: numbers for 'chinese' and 'islamic-umalqura', English month names
 * for 'hebrew' (e.g. 'Kislev'). Uses the ICU calendars behind Intl; returns []
 * where they are missing, so the occasion just does not show.
 */
export function fromCalendar(calendar: 'chinese' | 'hebrew' | 'islamic-umalqura', y: number, month: number | string, day: number): number[] {
  const key = `${calendar}|${y}|${month}|${day}`
  const known = calendarCache.get(key)
  if (known) {
    return known
  }
  const found: number[] = []
  try {
    const fmt = new Intl.DateTimeFormat(`en-u-ca-${calendar}`, {
      timeZone: 'UTC',
      month: typeof month === 'number' ? 'numeric' : 'long',
      day: 'numeric',
    })
    if (fmt.resolvedOptions().calendar !== calendar) {
      throw new Error(`calendar ${calendar} not supported`)
    }
    for (let n = dayNumber(y, 1, 1); n <= dayNumber(y, 12, 31); n++) {
      const parts = fmt.formatToParts(new Date(n * 86400000 + 43200000))
      const m = parts.find(p => p.type === 'month')?.value ?? ''
      const d = Number(parts.find(p => p.type === 'day')?.value)
      // A leap month reads like '4bis' and does not count as the month itself.
      const monthMatches = typeof month === 'number' ? m === String(month) : m === month
      if (monthMatches && d === day) {
        found.push(n)
      }
    }
  } catch {
    // No ICU calendar here: leave the occasion out.
  }
  calendarCache.set(key, found)
  return found
}

/** One day, or a span of days around it, as a range list. */
function span(start: number, before = 0, after = 0): DayRange[] {
  return [[start - before, start + after]]
}

function fixed(m: number, d: number, length = 1): (y: number) => DayRange[] {
  return y => {
    const n = dayNumber(y, m, d)
    return [[n, n + length - 1]]
  }
}

/** First and last day of carnival, by subdivision (relative to Easter). */
function carnivalDays(y: number, ctx: OccasionContext): DayRange[] {
  const easter = easterDay(y)
  if (ctx.subdivision === 'CH-BS') {
    return [[easter - 41, easter - 39]] // Monday to Wednesday after Ash Wednesday
  }
  if (ctx.subdivision === 'CH-BE') {
    return [[easter - 43, easter - 41]] // Thursday to Saturday after Ash Wednesday
  }
  return [[easter - 52, easter - 47]] // Schmutziger Donnerstag to Güdisdienstag
}

/** Zurich's spring festival: the third Monday in April, a week later when that is Easter Monday. */
function sechselaeutenDay(y: number): number {
  const third = nthWeekday(y, 4, 1, 3)
  return third === easterDay(y) + 1 ? third + 7 : third
}

// ── the table ─────────────────────────────────────────────────────────────

/** Priorities follow the order the checks had before the table, so Switzerland sees the same. */
export const OCCASIONS: readonly OccasionDef[] = [
  { id: 'carnival', regions: ['CH'], priority: 170, days: carnivalDays, decor: 'carnival', costume: 'jester' },
  { id: 'easter', regions: ['CH'], priority: 160, days: y => span(easterDay(y), 2, 1), decor: 'easter', costume: 'bunny' },
  { id: 'ascension', regions: ['CH'], priority: 150, days: y => span(easterDay(y) + 39), decor: 'ascension' },
  { id: 'pentecost', regions: ['CH'], priority: 140, days: y => span(easterDay(y) + 49, 0, 1), decor: 'pentecost' },
  { id: 'valentinesDay', regions: 'global', priority: 130, days: fixed(2, 14), decor: 'valentinesDay', costume: 'rose' },
  { id: 'womensDay', regions: 'global', priority: 120, days: fixed(3, 8), decor: 'womensDay', costume: 'mimosa' },
  { id: 'sechselaeuten', regions: ['CH-ZH'], priority: 110, days: y => span(sechselaeutenDay(y)), decor: 'sechselaeuten' },
  { id: 'labourDay', regions: ['CH'], priority: 100, days: fixed(5, 1), decor: 'labourDay' },
  { id: 'mothersDay', regions: ['CH'], priority: 90, days: y => span(nthWeekday(y, 5, 0, 2)), decor: 'mothersDay', costume: 'bouquet' },
  { id: 'solstice', regions: 'global', priority: 80, days: fixed(6, 21), decor: 'solstice', costume: 'sunglasses' },
  { id: 'halloween', regions: 'global', priority: 70, days: fixed(10, 30, 2), decor: 'halloween', costume: 'witch' },
  { id: 'swissNationalDay', regions: ['CH'], priority: 60, days: y => [[dayNumber(y, 7, 31), dayNumber(y, 8, 1)]], decor: 'swissNationalDay', costume: 'flag' },
  { id: 'stNicholas', regions: ['CH'], priority: 50, days: fixed(12, 6), decor: 'stNicholas', costume: 'mitre' },
  { id: 'newYearsEve', regions: 'global', priority: 40, days: fixed(12, 31), decor: 'newYearsEve', costume: 'party' },
  { id: 'newYear', regions: 'global', priority: 30, days: fixed(1, 1), decor: 'newYear', costume: 'party' },
  { id: 'christmas', regions: ['CH'], priority: 20, days: fixed(12, 24, 3), decor: 'christmas', costume: 'santa' },
  { id: 'advent', regions: ['CH'], priority: 10, days: fixed(12, 1, 23), decor: 'advent' },
]

const BY_ID = new Map(OCCASIONS.map(o => [o.id, o]))

export function occasionDef(id: Occasion): OccasionDef | undefined {
  return BY_ID.get(id)
}

/** Whether an occasion applies where the person is, given what they switched on or off. */
export function isActive(def: OccasionDef, ctx: OccasionContext): boolean {
  const switched = ctx.enabled[def.id]
  // New Year's Eve also follows the older newYear switch.
  if (switched === false || (def.id === 'newYearsEve' && ctx.enabled.newYear === false)) {
    return false
  }
  if (ctx.extra.includes(def.id)) {
    return true
  }
  if (def.offByDefault && switched !== true) {
    return false
  }
  if (def.regions === 'global') {
    return true
  }
  return def.regions.includes(ctx.region) || (ctx.subdivision !== '' && def.regions.includes(ctx.subdivision))
}

function rangesAround(def: OccasionDef, y: number, ctx: OccasionContext): DayRange[] {
  // Ranges from the year before can reach into this one (Kwanzaa, Lunar New Year's eve).
  return [...(def.days(y - 1, ctx) ?? []), ...(def.days(y, ctx) ?? [])]
}

/** The occasion shown on a day, if any: the active one with the highest priority. */
export function occasionOn(date: DateParts, ctx: OccasionContext): Occasion | undefined {
  const today = dayNumber(date.y, date.m, date.d)
  let best: OccasionDef | undefined
  for (const def of OCCASIONS) {
    if ((best && def.priority <= best.priority) || !isActive(def, ctx)) {
      continue
    }
    if (rangesAround(def, date.y, ctx).some(([from, to]) => today >= from && today <= to)) {
      best = def
    }
  }
  return best?.id
}

/** How many days into its occasion a day is (0 on the first day), for decorations that change day by day. */
export function occasionDayIndex(id: Occasion, date: DateParts, ctx: OccasionContext): number {
  const def = BY_ID.get(id)
  const today = dayNumber(date.y, date.m, date.d)
  const range = def ? rangesAround(def, date.y, ctx).find(([from, to]) => today >= from && today <= to) : undefined
  return range ? today - range[0] : 0
}

/** The first day of an occasion in year y, for previews; undefined when it has none that year. */
export function occasionStart(id: Occasion, y: number, ctx: OccasionContext): DateParts | undefined {
  const first = BY_ID.get(id)?.days(y, ctx)?.[0]
  return first ? fromDayNumber(first[0]) : undefined
}

/** The next start of an occasion on or after a day, looking up to two years ahead. */
export function nextOccasionStart(id: Occasion, from: DateParts, ctx: OccasionContext): DateParts | undefined {
  const today = dayNumber(from.y, from.m, from.d)
  const def = BY_ID.get(id)
  if (!def) {
    return undefined
  }
  for (const y of [from.y, from.y + 1, from.y + 2]) {
    const start = (def.days(y, ctx) ?? []).map(r => r[0]).find(n => n >= today)
    if (start !== undefined) {
      return fromDayNumber(start)
    }
  }
  return undefined
}
