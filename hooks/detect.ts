// Works out region, time zone and hemisphere when the settings say 'auto',
// from what the system reports, without any network access.
//
// Order of evidence:
// 1. The time zone (Intl.DateTimeFormat().resolvedOptions().timeZone) mapped to
//    its countries through ZONES, generated from the IANA database.
// 2. The locale's region (de-CH -> CH) breaks ties when several countries share
//    a zone, and stands alone when the zone is missing, UTC or Etc/*.
// 3. The zone's latitude gives the hemisphere, which is right even for
//    countries that span the equator, such as Brazil or Ecuador.
// The subdivision is never guessed. Values set by hand always win.
//
// Windows (checked): on a Swiss Windows machine with PowerShell 7.7, Node
// reports locale 'de-CH' and timeZone 'Europe/Zurich', not 'Europe/Berlin'.
// Node/ICU resolves the coarse Windows zone ("W. Europe Standard Time") through
// the system region. The locale tiebreaker stays for machines whose Windows
// region does not match where they are.

import { ZONES } from './zones.js'

export type Hemisphere = 'north' | 'south'

/** What the system reports. */
export type Environment = { locale: string; timeZone: string }

/** The settings detection reads. */
export type RegionSettings = {
  region: string
  subdivision: string
  timeZone: string
  hemisphere: 'auto' | Hemisphere
  /** Old setting from before regions existed. */
  location?: string
}

export type Resolved = {
  /** ISO 3166 country code, or 'XX' when unknown (only global occasions then). */
  region: string
  /** ISO 3166-2 code or ''. */
  subdivision: string
  /** IANA time zone the calendar day is counted in. */
  timeZone: string
  hemisphere: Hemisphere
  /** Where each value came from, for /backdrop to show. */
  source: {
    region: 'setting' | 'zone' | 'locale' | 'legacy' | 'none'
    timeZone: 'setting' | 'system' | 'region' | 'fallback'
    hemisphere: 'setting' | 'zone' | 'region'
  }
  /** The system's zone and locale, as read. */
  env: Environment
}

/** Countries mostly in the southern hemisphere, for a region set by hand. */
const SOUTHERN = new Set([
  'AU', 'NZ', 'AR', 'CL', 'UY', 'PY', 'BO', 'PE', 'BR', 'ZA', 'NA', 'BW', 'ZW', 'MZ', 'MG', 'MU', 'LS', 'SZ',
  'ZM', 'MW', 'AO', 'TZ', 'FJ', 'PG', 'NC', 'WS', 'TO', 'VU', 'SB', 'ID', 'TL', 'RE',
])

/** Old location values and the region and subdivision they stand for. */
const LEGACY: Record<string, string> = { zurich: 'CH-ZH', basel: 'CH-BS', bern: 'CH-BE', lucerne: 'CH-LU', other: '' }

/** The time zone and locale the system reports; empty strings when it reports nothing. */
export function readEnvironment(): Environment {
  try {
    const r = Intl.DateTimeFormat().resolvedOptions()
    return { locale: r.locale ?? '', timeZone: r.timeZone ?? '' }
  } catch {
    return { locale: '', timeZone: '' }
  }
}

/** The region part of a locale: 'de-CH' -> 'CH', 'en' -> ''. */
export function localeRegion(locale: string): string {
  try {
    const region = new Intl.Locale(locale).region
    if (region) {
      return region.toUpperCase()
    }
  } catch {
    // Fall through to a plain parse.
  }
  const m = /^[a-z]{2,3}(?:[-_][A-Za-z]{4})?[-_]([A-Za-z]{2})\b/.exec(locale)
  return m?.[1]?.toUpperCase() ?? ''
}

/** The language part of a locale: 'fr-CH' -> 'fr'. */
export function localeLanguage(locale: string): string {
  return (locale.split(/[-_]/)[0] ?? '').toLowerCase()
}

function isVague(zone: string): boolean {
  return zone === '' || zone === 'UTC' || zone === 'GMT' || zone.startsWith('Etc/')
}

function countriesOf(zone: string): string[] {
  return ZONES[zone]?.[0].split(',') ?? []
}

/** The zone whose own country (listed first) is this region, e.g. CH -> Europe/Zurich. */
export function homeZone(region: string): string | undefined {
  for (const [zone, [countries]] of Object.entries(ZONES)) {
    if (countries.split(',')[0] === region) {
      return zone
    }
  }
  return undefined
}

export function resolveRegion(settings: RegionSettings, env: Environment): Resolved {
  let region = settings.region.trim().toUpperCase()
  let subdivision = settings.subdivision.trim().toUpperCase()
  let regionSource: Resolved['source']['region'] = 'setting'

  const legacy = settings.location !== undefined ? LEGACY[settings.location] : undefined
  if (region === 'AUTO' && legacy !== undefined) {
    region = 'CH'
    subdivision = subdivision || legacy
    regionSource = 'legacy'
  }

  const zone = env.timeZone
  const zoneCountries = isVague(zone) ? [] : countriesOf(zone)
  const fromLocale = localeRegion(env.locale)
  if (region === 'AUTO') {
    if (zoneCountries.length > 0) {
      region = fromLocale && zoneCountries.includes(fromLocale) ? fromLocale : (zoneCountries[0] ?? 'XX')
      regionSource = 'zone'
    } else if (fromLocale) {
      region = fromLocale
      regionSource = 'locale'
    } else {
      region = 'XX'
      regionSource = 'none'
    }
  }
  // A subdivision only counts inside its own country.
  if (subdivision && !subdivision.startsWith(`${region}-`)) {
    subdivision = ''
  }

  let timeZone = settings.timeZone.trim()
  let tzSource: Resolved['source']['timeZone'] = 'setting'
  if (timeZone === '' || timeZone.toLowerCase() === 'auto') {
    if (!isVague(zone)) {
      timeZone = zone
      tzSource = 'system'
    } else {
      // A server or cloud machine on UTC: count the days where the region is.
      const home = region !== 'XX' ? homeZone(region) : undefined
      timeZone = home ?? 'UTC'
      tzSource = home ? 'region' : 'fallback'
    }
  }

  let hemisphere: Hemisphere
  let hemiSource: Resolved['source']['hemisphere'] = 'setting'
  if (settings.hemisphere === 'north' || settings.hemisphere === 'south') {
    hemisphere = settings.hemisphere
  } else {
    const lat = ZONES[timeZone]?.[1]
    const zoneFitsRegion = countriesOf(timeZone).includes(region)
    if (lat !== undefined && zoneFitsRegion) {
      hemisphere = lat < 0 ? 'south' : 'north'
      hemiSource = 'zone'
    } else {
      hemisphere = SOUTHERN.has(region) ? 'south' : 'north'
      hemiSource = 'region'
    }
  }

  return {
    region,
    subdivision,
    timeZone,
    hemisphere,
    source: { region: regionSource, timeZone: tzSource, hemisphere: hemiSource },
    env,
  }
}
