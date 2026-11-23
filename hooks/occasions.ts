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
export type CostumeKey =
  | 'witch'
  | 'santa'
  | 'mitre'
  | 'bunny'
  | 'party'
  | 'jester'
  | 'flag'
  | 'rose'
  | 'bouquet'
  | 'mimosa'
  | 'sunglasses'
  | 'crown'
  | 'greenHat'
  | 'candleWreath'
  | 'flowerWreath'
  | 'tie'

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
 * and day: numbers for 'chinese', 'islamic-umalqura' and 'persian', English month names
 * for 'hebrew' (e.g. 'Kislev'). Uses the ICU calendars behind Intl; returns []
 * where they are missing, so the occasion just does not show.
 */
export function fromCalendar(calendar: 'chinese' | 'hebrew' | 'islamic-umalqura' | 'persian', y: number, month: number | string, day: number): number[] {
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

/**
 * Days the ICU Chinese calendar gets wrong because the new moon falls within
 * minutes of midnight in Beijing. Checked against published calendars:
 * 2027-02-06 (officeholidays.com, Chinese New Year page) and 2030-02-03
 * (timeanddate.com/holidays/china/2030, calendardate.com). Mid-Autumn dates
 * come from ICU alone and may be a day off in such rare years.
 */
const LUNAR_NEW_YEAR_FIX: Record<number, string> = { 2027: '2027-02-06', 2030: '2030-02-03' }

function lunarNewYearDay(y: number): number[] {
  const fix = LUNAR_NEW_YEAR_FIX[y]
  if (fix) {
    const [fy, fm, fd] = fix.split('-').map(Number)
    return [dayNumber(fy ?? y, fm ?? 1, fd ?? 1)]
  }
  return fromCalendar('chinese', y, 1, 1)
}

/**
 * Festivals Intl cannot compute (Hindu and Buddhist lunisolar dates), from
 * published calendars; years without a firm date are left out, and so is the
 * occasion in those years. Sources (found through web search, cross-checked
 * where several agreed):
 * - Diwali (Lakshmi Puja, New Delhi): drikpanchang.com (2026-2028),
 *   subhsandesh.in "Diwali dates next 10 years" (2027-2036), prokerala.com and
 *   hinduplace.com (2029-2035), panchang.astrosage.com (2036).
 * - Holi (Rangwali Holi / Dhulandi, New Delhi): cag.gov.in gazetted list (2026),
 *   calendardate.com and festivedates.com (2027-2030), drikpanchang.com
 *   (2031-2033), epicastrology.com (2031-2036); 2034 left out (sources disagree).
 * - Vesak: mom.gov.sg public holidays (Singapore 2026, 2027), the same days in
 *   Malaysia and Thailand (officeholidays.com, thaiholidayguide.com); Sri Lanka
 *   2026 from the government's declaration (30 May). Later years are not
 *   published yet.
 */
const TABLE: Record<'diwali' | 'holi' | 'vesak' | 'vesakLK', readonly string[]> = {
  diwali: ['2026-11-08', '2027-10-29', '2028-10-17', '2029-11-05', '2030-10-26', '2031-11-14', '2032-11-02', '2033-10-22', '2034-11-10', '2035-10-30', '2036-10-18'],
  holi: ['2026-03-04', '2027-03-22', '2028-03-11', '2029-03-01', '2030-03-20', '2031-03-09', '2032-03-27', '2033-03-16', '2035-03-24', '2036-03-12'],
  vesak: ['2026-05-31', '2027-05-20'],
  vesakLK: ['2026-05-30'],
}

function fromTable(name: keyof typeof TABLE, y: number): number[] {
  return TABLE[name]
    .filter(iso => iso.startsWith(`${y}-`))
    .map(iso => {
      const [ty, tm, td] = iso.split('-').map(Number)
      return dayNumber(ty ?? y, tm ?? 1, td ?? 1)
    })
}

/** Ranges from a list of start days. */
function each(starts: number[], length = 1, before = 0): DayRange[] {
  return starts.map(n => [n - before, n - before + length - 1] as DayRange)
}

function mothersDay(y: number, ctx: OccasionContext): DayRange[] | undefined {
  const r = ctx.region
  if (['GB', 'IE'].includes(r)) return span(easterDay(y) - 21) // Mothering Sunday
  if (r === 'FR') {
    const last = lastWeekday(y, 5, 0)
    return span(last === easterDay(y) + 49 ? nthWeekday(y, 6, 0, 1) : last)
  }
  if (['MX', 'GT', 'SV'].includes(r)) return span(dayNumber(y, 5, 10))
  if (['ES', 'PT', 'LT', 'HU'].includes(r)) return span(nthWeekday(y, 5, 0, 1))
  return span(nthWeekday(y, 5, 0, 2))
}

function fathersDay(y: number, ctx: OccasionContext): DayRange[] | undefined {
  const r = ctx.region
  if (r === 'DE') return span(easterDay(y) + 39) // Vatertag on Ascension Day
  if (['AU', 'NZ'].includes(r)) return span(nthWeekday(y, 9, 0, 1))
  if (['IT', 'ES', 'PT'].includes(r)) return span(dayNumber(y, 3, 19))
  return span(nthWeekday(y, 6, 0, 3))
}

function midsummer(y: number, ctx: OccasionContext): DayRange[] {
  if (['NO', 'DK'].includes(ctx.region)) return span(dayNumber(y, 6, 23)) // Sankthans
  if (['EE', 'LV'].includes(ctx.region)) return [[dayNumber(y, 6, 23), dayNumber(y, 6, 24)]]
  if (ctx.region === 'LT') return span(dayNumber(y, 6, 24))
  // Sweden and Finland: Midsummer Eve, the Friday between 19 and 25 June.
  const from = dayNumber(y, 6, 19)
  return span(from + ((5 - weekdayOf(from) + 7) % 7))
}

function kingsDay(y: number): DayRange[] {
  const n = dayNumber(y, 4, 27)
  return span(weekdayOf(n) === 0 ? n - 1 : n)
}

// ── region groups ─────────────────────────────────────────────────────────

const EUROPE_WEST = ['CH', 'LI', 'DE', 'AT', 'FR', 'BE', 'NL', 'LU', 'IT', 'ES', 'PT', 'IE', 'GB', 'DK', 'NO', 'SE', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'MT', 'MC', 'SM', 'VA', 'AD', 'EE', 'LV', 'LT']
const AMERICAS = ['US', 'CA', 'MX', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA', 'CU', 'DO', 'PR', 'JM', 'TT', 'BS', 'BB', 'CO', 'VE', 'EC', 'PE', 'BO', 'BR', 'PY', 'UY', 'AR', 'CL']
const OCEANIA = ['AU', 'NZ', 'FJ', 'PG', 'WS', 'TO']
/** Where Western Easter is a public holiday. */
const WESTERN = [...EUROPE_WEST, ...AMERICAS, ...OCEANIA, 'PH', 'ZA']
/** Where Christmas is on 25 December (Orthodox countries on the Julian date are left out). */
const CHRISTMAS = [...WESTERN, 'GR', 'CY', 'RO', 'BG', 'UA']
const ORTHODOX = ['GR', 'CY', 'RO', 'BG', 'RS', 'UA', 'RU', 'GE', 'MK', 'ME', 'BA', 'ET']
const MUSLIM_MAJORITY = [
  'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'JO', 'IQ', 'SY', 'LB', 'PS', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'TR', 'IR',
  'AF', 'PK', 'BD', 'MY', 'ID', 'BN', 'MV', 'AZ', 'KZ', 'UZ', 'TJ', 'KG', 'TM', 'SN', 'ML', 'NE', 'TD', 'MR', 'SO', 'DJ',
  'KM', 'GM', 'GN', 'SL', 'AL', 'XK', 'BA',
]
const CHINESE_CALENDAR = ['CN', 'TW', 'HK', 'MO', 'SG', 'MY', 'VN', 'KR']
const LABOUR_DAY = [...EUROPE_WEST.filter(c => c !== 'NL'), ...ORTHODOX, ...AMERICAS, 'CN', 'HK', 'MO', 'TW', 'SG', 'MY', 'VN', 'IN', 'ZA', 'KE', 'NG', 'PH', 'KR', 'ID', 'TH', 'TR']

// ── the table ─────────────────────────────────────────────────────────────

/**
 * Priorities follow the order the checks had before the table, so Switzerland
 * sees the same; new occasions sit between them where they belong.
 * A new country needs one entry here (or its code in a group above) and its
 * name in each language in i18n.ts.
 */
export const OCCASIONS: readonly OccasionDef[] = [
  // Moveable feasts
  {
    id: 'carnival', regions: ['CH', 'LI', 'DE', 'AT', 'BE', 'NL', 'LU', 'IT', 'ES', 'PT', 'BR', 'CO', 'BO', 'TT'], priority: 170, decor: 'carnival', costume: 'jester',
    // Brazil and the Caribbean: Saturday to Tuesday before Ash Wednesday; elsewhere Weiberfastnacht to Shrove Tuesday.
    days: (y, ctx) => (['BR', 'BO', 'TT', 'CO'].includes(ctx.region) ? [[easterDay(y) - 50, easterDay(y) - 47]] : carnivalDays(y, ctx)),
  },
  { id: 'lunarNewYear', regions: CHINESE_CALENDAR, priority: 168, decor: 'lunarNewYear', days: y => each(lunarNewYearDay(y), 4, 1) },
  { id: 'easter', regions: WESTERN, priority: 160, days: y => span(easterDay(y), 2, 1), decor: 'easter', costume: 'bunny' },
  {
    id: 'orthodoxEaster', regions: ORTHODOX, priority: 158, decor: 'orthodoxEaster', costume: 'bunny',
    days: y => {
      const e = orthodoxEaster(y)
      return span(dayNumber(e.y, e.m, e.d), 2, 1)
    },
  },
  // Islamic dates follow Umm al-Qura and can differ by a day from the day observed locally.
  { id: 'eidAlFitr', regions: MUSLIM_MAJORITY, priority: 156, decor: 'eidAlFitr', days: y => each(fromCalendar('islamic-umalqura', y, 10, 1), 3) },
  { id: 'eidAlAdha', regions: MUSLIM_MAJORITY, priority: 155, decor: 'eidAlAdha', days: y => each(fromCalendar('islamic-umalqura', y, 12, 10), 4) },
  { id: 'fathersDay', regions: ['US', 'CA', 'GB', 'FR', 'NL', 'JP', 'IN', 'ZA', 'IE', 'DE', 'AU', 'NZ', 'IT', 'ES', 'PT'], priority: 152, costume: 'tie', days: fathersDay },
  { id: 'ascension', regions: ['CH', 'LI', 'DE', 'AT', 'FR', 'BE', 'NL', 'LU', 'DK', 'NO', 'SE', 'FI'], priority: 150, days: y => span(easterDay(y) + 39), decor: 'ascension' },
  { id: 'pentecost', regions: ['CH', 'LI', 'DE', 'AT', 'FR', 'BE', 'NL', 'LU', 'DK', 'NO', 'SE', 'FI'], priority: 140, days: y => span(easterDay(y) + 49, 0, 1), decor: 'pentecost' },
  { id: 'diwali', regions: ['IN', 'NP', 'LK', 'SG', 'MY', 'MU', 'FJ', 'TT'], priority: 138, decor: 'diwali', days: y => each(fromTable('diwali', y)) },
  { id: 'holi', regions: ['IN', 'NP'], priority: 137, decor: 'holi', days: y => each(fromTable('holi', y)) },
  { id: 'vesak', regions: ['SG', 'MY', 'TH', 'LK'], priority: 136, decor: 'vesak', days: (y, ctx) => each(fromTable(ctx.region === 'LK' ? 'vesakLK' : 'vesak', y)) },
  { id: 'hanukkah', regions: ['IL'], priority: 135, decor: 'hanukkah', days: y => each(fromCalendar('hebrew', y, 'Kislev', 25), 8) },
  { id: 'nowruz', regions: ['IR', 'AF', 'AZ', 'TJ', 'KZ', 'UZ', 'KG', 'TM'], priority: 134, decor: 'nowruz', days: y => each(fromCalendar('persian', y, 1, 1)) },
  { id: 'midAutumn', regions: ['CN', 'TW', 'HK', 'MO', 'SG', 'MY', 'VN'], priority: 133, decor: 'midAutumn', days: y => each(fromCalendar('chinese', y, 8, 15)) },
  // Fixed days
  { id: 'valentinesDay', regions: 'global', priority: 130, days: fixed(2, 14), decor: 'valentinesDay', costume: 'rose' },
  { id: 'stPatricksDay', regions: ['IE', 'GB-NIR', 'US', 'CA', 'AU'], priority: 125, days: fixed(3, 17), decor: 'stPatricksDay', costume: 'greenHat' },
  { id: 'womensDay', regions: 'global', priority: 120, days: fixed(3, 8), decor: 'womensDay', costume: 'mimosa' },
  { id: 'sechselaeuten', regions: ['CH-ZH'], priority: 110, days: y => span(sechselaeutenDay(y)), decor: 'sechselaeuten' },
  { id: 'kingsDay', regions: ['NL'], priority: 108, days: kingsDay, decor: 'kingsDay' },
  {
    id: 'labourDay', regions: LABOUR_DAY, priority: 100, decor: 'labourDay',
    days: (y, ctx) => (['US', 'CA'].includes(ctx.region) ? span(nthWeekday(y, 9, 1, 1)) : span(dayNumber(y, 5, 1))),
  },
  { id: 'childrensDay', regions: ['JP'], priority: 98, days: fixed(5, 5), decor: 'childrensDay' },
  { id: 'constitutionDayNO', regions: ['NO'], priority: 96, days: fixed(5, 17), decor: 'constitutionDayNO' },
  {
    id: 'mothersDay',
    regions: ['CH', 'LI', 'DE', 'AT', 'IT', 'NL', 'BE', 'DK', 'FI', 'US', 'CA', 'AU', 'NZ', 'BR', 'JP', 'CN', 'IN', 'ZA', 'GB', 'IE', 'FR', 'MX', 'GT', 'SV', 'ES', 'PT', 'LT', 'HU'],
    priority: 90, days: mothersDay, decor: 'mothersDay', costume: 'bouquet',
  },
  { id: 'italianRepublicDay', regions: ['IT'], priority: 88, days: fixed(6, 2), decor: 'italianRepublicDay' },
  { id: 'midsummer', regions: ['SE', 'FI', 'NO', 'DK', 'EE', 'LV', 'LT'], priority: 85, days: midsummer, decor: 'midsummer', costume: 'flowerWreath' },
  {
    id: 'solstice', regions: 'global', priority: 80, decor: 'solstice', costume: 'sunglasses',
    days: (y, ctx) => (ctx.hemisphere === 'south' ? fixed(12, 21)(y) : fixed(6, 21)(y)),
  },
  { id: 'canadaDay', regions: ['CA'], priority: 78, days: fixed(7, 1), decor: 'canadaDay' },
  { id: 'independenceDayUS', regions: ['US'], priority: 78, days: fixed(7, 4), decor: 'independenceDayUS' },
  { id: 'tanabata', regions: ['JP'], priority: 77, days: fixed(7, 7), decor: 'tanabata' },
  { id: 'bastilleDay', regions: ['FR'], priority: 78, days: fixed(7, 14), decor: 'bastilleDay' },
  { id: 'liechtensteinNationalDay', regions: ['LI'], priority: 78, days: fixed(8, 15), decor: 'liechtensteinNationalDay' },
  { id: 'indianIndependenceDay', regions: ['IN'], priority: 78, days: fixed(8, 15), decor: 'indianIndependenceDay' },
  { id: 'ukrainianIndependenceDay', regions: ['UA'], priority: 78, days: fixed(8, 24), decor: 'ukrainianIndependenceDay' },
  { id: 'brazilIndependenceDay', regions: ['BR'], priority: 78, days: fixed(9, 7), decor: 'brazilIndependenceDay' },
  { id: 'mexicanIndependenceDay', regions: ['MX'], priority: 78, days: fixed(9, 15, 2), decor: 'mexicanIndependenceDay' },
  { id: 'germanUnityDay', regions: ['DE'], priority: 78, days: fixed(10, 3), decor: 'germanUnityDay' },
  { id: 'spanishNationalDay', regions: ['ES'], priority: 78, days: fixed(10, 12), decor: 'spanishNationalDay' },
  {
    id: 'thanksgiving', regions: ['US', 'CA'], priority: 76, decor: 'thanksgiving',
    days: (y, ctx) => (ctx.region === 'CA' ? span(nthWeekday(y, 10, 1, 2)) : span(nthWeekday(y, 11, 4, 4))),
  },
  { id: 'austrianNationalDay', regions: ['AT'], priority: 78, days: fixed(10, 26), decor: 'austrianNationalDay' },
  { id: 'dayOfTheDead', regions: ['MX'], priority: 72, days: fixed(11, 1, 2), decor: 'dayOfTheDead' },
  { id: 'guyFawkesNight', regions: ['GB'], priority: 72, days: fixed(11, 5), decor: 'guyFawkesNight' },
  { id: 'halloween', regions: 'global', priority: 70, days: fixed(10, 30, 2), decor: 'halloween', costume: 'witch' },
  { id: 'polishIndependenceDay', regions: ['PL'], priority: 78, days: fixed(11, 11), decor: 'polishIndependenceDay' },
  // Not in CH by default, so Switzerland sees what it saw before; add it with extraOccasions.
  { id: 'stMartin', regions: ['DE', 'AT', 'NL', 'BE'], priority: 65, days: fixed(11, 11), decor: 'stMartin' },
  { id: 'swissNationalDay', regions: ['CH'], priority: 60, days: y => [[dayNumber(y, 7, 31), dayNumber(y, 8, 1)]], decor: 'swissNationalDay', costume: 'flag' },
  // Disputed in Australia: off unless switched on in the settings.
  { id: 'australiaDay', regions: ['AU'], priority: 58, offByDefault: true, days: fixed(1, 26), decor: 'australiaDay' },
  { id: 'waitangiDay', regions: ['NZ'], priority: 58, days: fixed(2, 6), decor: 'waitangiDay' },
  { id: 'epiphany', regions: ['ES', 'MX', 'IT', 'AT', 'PL', 'HR', 'SK', 'SE', 'FI'], priority: 56, days: fixed(1, 6), decor: 'epiphany', costume: 'crown' },
  { id: 'stLucia', regions: ['SE', 'NO', 'FI', 'DK'], priority: 55, days: fixed(12, 13), decor: 'stLucia', costume: 'candleWreath' },
  {
    id: 'stNicholas', regions: ['CH', 'LI', 'DE', 'AT', 'NL', 'BE', 'LU', 'CZ', 'PL', 'SK', 'HU', 'SI', 'HR'], priority: 50, decor: 'stNicholas', costume: 'mitre',
    // Sinterklaasavond in the Netherlands and Belgium is the evening before.
    days: (y, ctx) => (['NL', 'BE'].includes(ctx.region) ? fixed(12, 5)(y) : fixed(12, 6)(y)),
  },
  { id: 'hanami', regions: ['JP'], priority: 45, days: y => [[dayNumber(y, 3, 25), dayNumber(y, 4, 10)]], decor: 'hanami' },
  { id: 'newYearsEve', regions: 'global', priority: 40, days: fixed(12, 31), decor: 'newYearsEve', costume: 'party' },
  { id: 'ramadan', regions: MUSLIM_MAJORITY, priority: 35, decor: 'ramadan', days: y => each(fromCalendar('islamic-umalqura', y, 9, 1), 29) },
  // Only with extraOccasions.
  { id: 'kwanzaa', regions: [], priority: 32, days: y => [[dayNumber(y, 12, 26), dayNumber(y + 1, 1, 1)]], decor: 'kwanzaa' },
  { id: 'newYear', regions: 'global', priority: 30, days: fixed(1, 1), decor: 'newYear', costume: 'party' },
  { id: 'boxingDay', regions: ['GB', 'IE', 'AU', 'NZ', 'CA', 'ZA'], priority: 25, days: fixed(12, 26), decor: 'christmas', costume: 'santa' },
  { id: 'christmas', regions: CHRISTMAS, priority: 20, days: fixed(12, 24, 3), decor: 'christmas', costume: 'santa' },
  { id: 'advent', regions: CHRISTMAS, priority: 10, days: fixed(12, 1, 23), decor: 'advent' },
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
