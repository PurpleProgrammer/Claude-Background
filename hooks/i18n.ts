// Every text the mod shows, in English and German. SETTINGS.language picks one.

import { SETTINGS, type Language, type Weather } from './settings.js'

export type Season = 'winter' | 'thaw' | 'firstSnow' | 'spring' | 'summer' | 'autumn'
export type Occasion = 'easter' | 'swissNationalDay' | 'advent' | 'christmas' | 'newYearsEve' | 'newYear'

type Texts = {
  seasons: Record<Season, string>
  occasions: Record<Occasion, string>
  weather: Record<Weather, string>
  contextShare: (percent: number) => string
  loadingModel: string
  unknownModel: string
  newYearGreeting: string
  alt: (season: string, percent: number, model: string) => string
  commandDescription: string
  help: string
  date: (y: number, m: number, d: number) => string
  labels: { date: string; season: string; occasion: string; model: string; weather: string; context: string; accessories: string }
  preview: string
  accessories: { hat: string; scarf: string; broom: string; none: string }
  previewEnded: string
  dateUsage: string
  unknown: (args: string) => string
  cheer: string
  fright: string
}

const EN: Texts = {
  seasons: { winter: 'Winter', thaw: 'Thaw', firstSnow: 'First snow', spring: 'Spring', summer: 'Summer', autumn: 'Autumn' },
  occasions: {
    easter: 'Easter',
    swissNationalDay: 'Swiss National Day',
    advent: 'Advent',
    christmas: 'Christmas',
    newYearsEve: "New Year's Eve",
    newYear: 'New Year',
  },
  weather: { clear: 'clear', sunset: 'sunset', fog: 'fog' },
  contextShare: p => `${p}% context`,
  loadingModel: 'Loading model',
  unknownModel: 'unknown',
  newYearGreeting: 'Happy New Year!',
  alt: (season, p, model) => `Landscape (${season}), context ${p}% full, model ${model}`,
  commandDescription: 'Winter landscape: preview seasons, occasions, weather, context and moods',
  help: [
    'Winter landscape preview:',
    '  /winter                      show the current state',
    '  /winter <season|occasion>    winter, firstsnow, thaw, spring, summer, autumn,',
    '                               easter, nationalday, advent, christmas, newyearseve, newyear',
    '  /winter date 2027-03-20      any date',
    '  /winter weather clear|sunset|fog',
    '  /winter context 80           simulate how full the context is',
    '  /winter cheer | fright       let the figure cheer or get a fright',
    '  /winter reset                end all previews',
  ].join('\n'),
  date: (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
  labels: { date: 'Date', season: 'Season', occasion: 'Occasion', model: 'Model', weather: 'Weather', context: 'Context', accessories: 'Accessories' },
  preview: '(preview)',
  accessories: { hat: 'hat', scarf: 'scarf', broom: 'broom and mittens', none: 'none yet' },
  previewEnded: 'Preview ended.',
  dateUsage: 'Usage: /winter date 2027-03-20',
  unknown: args => `Unknown: "${args}".`,
  cheer: 'The figure cheers.',
  fright: 'The figure gets a fright.',
}

const DE: Texts = {
  seasons: { winter: 'Winter', thaw: 'Tauwetter', firstSnow: 'Erster Schnee', spring: 'Frühling', summer: 'Sommer', autumn: 'Herbst' },
  occasions: {
    easter: 'Ostern',
    swissNationalDay: '1. August',
    advent: 'Advent',
    christmas: 'Weihnachten',
    newYearsEve: 'Silvester',
    newYear: 'Neujahr',
  },
  weather: { clear: 'klar', sunset: 'Abendrot', fog: 'Nebel' },
  contextShare: p => `${p} % Kontext`,
  loadingModel: 'Modell wird geladen',
  unknownModel: 'unbekannt',
  newYearGreeting: 'Es guets Neus!',
  alt: (season, p, model) => `Landschaft (${season}), Kontext zu ${p} Prozent gefüllt, Modell ${model}`,
  commandDescription: 'Winterlandschaft: Vorschau von Jahreszeiten, Anlässen, Wetter, Kontext und Stimmungen',
  help: [
    'Vorschau der Winterlandschaft:',
    '  /winter                      zeigt den aktuellen Zustand',
    '  /winter <jahreszeit|anlass>  winter, ersterschnee, tauwetter, frühling, sommer, herbst,',
    '                               ostern, nationalfeiertag, advent, weihnachten, silvester, neujahr',
    '  /winter datum 2027-03-20     beliebiges Datum',
    '  /winter wetter klar|abendrot|nebel',
    '  /winter kontext 80           Kontext-Füllstand simulieren',
    '  /winter jubel | schreck      Figur jubeln oder erschrecken lassen',
    '  /winter zurück               alle Vorschauen beenden',
    '',
    'Die englischen Wörter (date, weather, context, cheer, reset …) funktionieren ebenfalls.',
  ].join('\n'),
  date: (y, m, d) => `${d}.${m}.${y}`,
  labels: { date: 'Datum', season: 'Jahreszeit', occasion: 'Anlass', model: 'Modell', weather: 'Wetter', context: 'Kontext', accessories: 'Accessoires' },
  preview: '(Vorschau)',
  accessories: { hat: 'Mütze', scarf: 'Schal', broom: 'Besen und Fäustlinge', none: 'noch keine' },
  previewEnded: 'Vorschau beendet.',
  dateUsage: 'Bitte so: /winter datum 2027-03-20',
  unknown: args => `Unbekannt: "${args}".`,
  cheer: 'Die Figur jubelt.',
  fright: 'Die Figur erschrickt.',
}

const ALL: Record<Language, Texts> = { en: EN, de: DE }

/** The texts in the language the settings name, English when it names another. */
export function t(): Texts {
  return ALL[SETTINGS.language] ?? EN
}
