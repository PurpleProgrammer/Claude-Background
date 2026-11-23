// Every text the mod shows, in English and German. SETTINGS.language picks one.

import { SETTINGS, type FallingMode, type Language, type Weather } from './settings.js'

export type Season = 'winter' | 'thaw' | 'firstSnow' | 'spring' | 'summer' | 'autumn'
export type Occasion =
  | 'valentinesDay'
  | 'carnival'
  | 'womensDay'
  | 'easter'
  | 'sechselaeuten'
  | 'labourDay'
  | 'mothersDay'
  | 'ascension'
  | 'pentecost'
  | 'solstice'
  | 'swissNationalDay'
  | 'halloween'
  | 'stNicholas'
  | 'advent'
  | 'christmas'
  | 'newYearsEve'
  | 'newYear'

type Texts = {
  seasons: Record<Season, string>
  occasions: Record<Occasion, string>
  weather: Record<Weather, string>
  falling: Record<FallingMode, string>
  fallingSet: (mode: string) => string
  layoutSet: (figure: number, moon: number) => string
  layoutUsage: string
  contextShare: (percent: number) => string
  loadingModel: string
  unknownModel: string
  newYearGreeting: string
  alt: (season: string, percent: number, model: string) => string
  commandDescription: string
  help: string
  date: (y: number, m: number, d: number) => string
  labels: { date: string; season: string; occasion: string; model: string; weather: string; context: string; accessories: string; falling: string; layout: string }
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
    valentinesDay: "Valentine's Day",
    carnival: 'Carnival',
    womensDay: "International Women's Day",
    easter: 'Easter',
    sechselaeuten: 'Sechseläuten',
    labourDay: 'Labour Day',
    mothersDay: "Mother's Day",
    ascension: 'Ascension Day',
    pentecost: 'Pentecost',
    solstice: 'Midsummer',
    halloween: 'Halloween',
    stNicholas: 'St Nicholas Day',
    swissNationalDay: 'Swiss National Day',
    advent: 'Advent',
    christmas: 'Christmas',
    newYearsEve: "New Year's Eve",
    newYear: 'New Year',
  },
  weather: { clear: 'clear', sunset: 'sunset', fog: 'fog', magic: 'magic' },
  falling: { always: 'always', burst: 'a few seconds after each change', freeze: 'a few seconds after each change, then frozen in mid-air', off: 'off' },
  fallingSet: mode => `Falling: ${mode}. Remembered for your next sessions.`,
  layoutSet: (f, m) => `Figure at ${f} %, moon at ${m} % of the window width. Remembered for your next sessions.`,
  layoutUsage: 'Usage: /backdrop figure 20 · /backdrop moon 85 · /backdrop layout reset',
  contextShare: p => `${p}% context`,
  loadingModel: 'Loading model',
  unknownModel: 'unknown',
  newYearGreeting: 'Happy New Year!',
  alt: (season, p, model) => `Landscape (${season}), context ${p}% full, model ${model}`,
  commandDescription: 'Interactive background: preview seasons, occasions, weather, context and moods',
  help: [
    'Interactive background (/backdrop or /winter):',
    '  /winter                      show the current state',
    '  /winter <season|occasion>    winter, firstsnow, thaw, spring, summer, autumn,',
    '                               valentine, carnival, womensday, easter, sechselaeuten, labourday,',
    '                               mothersday, ascension, pentecost, midsummer, nationalday, halloween,',
    '                               stnicholas, advent, christmas, newyearseve, newyear',
    '  /winter date 2027-03-20      any date',
    '  /winter weather clear|sunset|fog|magic',
    '  /winter context 80           simulate how full the context is',
    '  /winter cheer | fright       let the figure cheer or get a fright',
    '  /winter falling always|burst|freeze|off   fall always, for a few seconds then clear,',
    '                               for a few seconds then freeze in mid-air, or never',
    '  /winter figure 20 | moon 85  move the figure or the moon (percent of the window width)',
    '  /winter layout reset         back to the positions in the settings',
    '  /winter reset                end all previews',
  ].join('\n'),
  date: (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
  labels: { date: 'Date', season: 'Season', occasion: 'Occasion', model: 'Model', weather: 'Weather', context: 'Context', accessories: 'Accessories', falling: 'Falling', layout: 'Layout' },
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
    valentinesDay: 'Valentinstag',
    carnival: 'Fasnacht',
    womensDay: 'Tag der Frau',
    easter: 'Ostern',
    sechselaeuten: 'Sechseläuten',
    labourDay: 'Tag der Arbeit',
    mothersDay: 'Muttertag',
    ascension: 'Auffahrt',
    pentecost: 'Pfingsten',
    solstice: 'Sommersonnenwende',
    halloween: 'Halloween',
    stNicholas: 'St. Nikolaus',
    swissNationalDay: '1. August',
    advent: 'Advent',
    christmas: 'Weihnachten',
    newYearsEve: 'Silvester',
    newYear: 'Neujahr',
  },
  weather: { clear: 'klar', sunset: 'Abendrot', fog: 'Nebel', magic: 'Zauber' },
  falling: { always: 'immer', burst: 'ein paar Sekunden nach jeder Änderung', freeze: 'ein paar Sekunden nach jeder Änderung, dann bleibt alles in der Luft stehen', off: 'aus' },
  fallingSet: mode => `Fallen: ${mode}. Wird für die nächsten Sitzungen gemerkt.`,
  layoutSet: (f, m) => `Figur bei ${f} %, Mond bei ${m} % der Fensterbreite. Wird für die nächsten Sitzungen gemerkt.`,
  layoutUsage: 'Bitte so: /backdrop figur 20 · /backdrop mond 85 · /backdrop layout zurück',
  contextShare: p => `${p} % Kontext`,
  loadingModel: 'Modell wird geladen',
  unknownModel: 'unbekannt',
  newYearGreeting: 'Es guets Neus!',
  alt: (season, p, model) => `Landschaft (${season}), Kontext zu ${p} Prozent gefüllt, Modell ${model}`,
  commandDescription: 'Interaktiver Hintergrund: Vorschau von Jahreszeiten, Anlässen, Wetter, Kontext und Stimmungen',
  help: [
    'Interaktiver Hintergrund (/backdrop oder /winter):',
    '  /winter                      zeigt den aktuellen Zustand',
    '  /winter <jahreszeit|anlass>  winter, ersterschnee, tauwetter, frühling, sommer, herbst,',
    '                               valentinstag, fasnacht, tagderfrau, ostern, sechseläuten,',
    '                               tagderarbeit, muttertag, auffahrt, pfingsten, sonnenwende,',
    '                               nationalfeiertag, halloween, nikolaus, advent, weihnachten,',
    '                               silvester, neujahr',
    '  /winter datum 2027-03-20     beliebiges Datum',
    '  /winter wetter klar|abendrot|nebel|zauber',
    '  /winter kontext 80           Kontext-Füllstand simulieren',
    '  /winter jubel | schreck      Figur jubeln oder erschrecken lassen',
    '  /winter fallen immer|kurz|einfrieren|aus   immer, ein paar Sekunden und dann klar,',
    '                               ein paar Sekunden und dann in der Luft stehen, oder nie',
    '  /winter figur 20 | mond 85   Figur oder Mond verschieben (Prozent der Fensterbreite)',
    '  /winter layout zurück        zurück zu den Positionen aus den Einstellungen',
    '  /winter zurück               alle Vorschauen beenden',
    '',
    'Die englischen Wörter (date, weather, context, cheer, reset …) funktionieren ebenfalls.',
  ].join('\n'),
  date: (y, m, d) => `${d}.${m}.${y}`,
  labels: { date: 'Datum', season: 'Jahreszeit', occasion: 'Anlass', model: 'Modell', weather: 'Wetter', context: 'Kontext', accessories: 'Accessoires', falling: 'Fallen', layout: 'Anordnung' },
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
