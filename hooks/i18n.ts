// Every text the mod shows, in English and German. SETTINGS.language picks one.

import { SETTINGS, type FallingMode, type Language, type Weather } from './settings.js'

export type Season = 'winter' | 'thaw' | 'firstSnow' | 'spring' | 'summer' | 'autumn'
export type Occasion =
  | 'valentinesDay'
  | 'carnival'
  | 'womensDay'
  | 'easter'
  | 'orthodoxEaster'
  | 'sechselaeuten'
  | 'labourDay'
  | 'mothersDay'
  | 'fathersDay'
  | 'ascension'
  | 'pentecost'
  | 'solstice'
  | 'midsummer'
  | 'swissNationalDay'
  | 'halloween'
  | 'stNicholas'
  | 'advent'
  | 'christmas'
  | 'boxingDay'
  | 'newYearsEve'
  | 'newYear'
  | 'epiphany'
  | 'stPatricksDay'
  | 'stMartin'
  | 'stLucia'
  | 'germanUnityDay'
  | 'austrianNationalDay'
  | 'liechtensteinNationalDay'
  | 'bastilleDay'
  | 'italianRepublicDay'
  | 'spanishNationalDay'
  | 'kingsDay'
  | 'independenceDayUS'
  | 'canadaDay'
  | 'mexicanIndependenceDay'
  | 'brazilIndependenceDay'
  | 'australiaDay'
  | 'waitangiDay'
  | 'indianIndependenceDay'
  | 'polishIndependenceDay'
  | 'ukrainianIndependenceDay'
  | 'constitutionDayNO'
  | 'thanksgiving'
  | 'guyFawkesNight'
  | 'dayOfTheDead'
  | 'childrensDay'
  | 'tanabata'
  | 'hanami'
  | 'lunarNewYear'
  | 'midAutumn'
  | 'nowruz'
  | 'ramadan'
  | 'eidAlFitr'
  | 'eidAlAdha'
  | 'hanukkah'
  | 'diwali'
  | 'holi'
  | 'vesak'
  | 'kwanzaa'

type Texts = {
  seasons: Record<Season, string>
  occasions: Record<Occasion, string>
  weather: Record<Weather, string>
  falling: Record<FallingMode, string>
  fallingSet: (mode: string) => string
  layoutSet: (figure: number, moon: number) => string
  regionLine: (region: string, how: string, timeZone: string, hemisphere: string) => string
  regionHow: { setting: string; zone: (zone: string) => string; locale: (locale: string) => string; legacy: string; none: string }
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
    orthodoxEaster: 'Orthodox Easter',
    sechselaeuten: 'Sechseläuten',
    labourDay: 'Labour Day',
    mothersDay: "Mother's Day",
    fathersDay: "Father's Day",
    ascension: 'Ascension Day',
    pentecost: 'Pentecost',
    solstice: 'Summer solstice',
    midsummer: 'Midsummer',
    swissNationalDay: 'Swiss National Day',
    halloween: 'Halloween',
    stNicholas: 'St Nicholas Day',
    advent: 'Advent',
    christmas: 'Christmas',
    boxingDay: 'Boxing Day',
    newYearsEve: "New Year's Eve",
    newYear: 'New Year',
    epiphany: 'Epiphany',
    stPatricksDay: "St Patrick's Day",
    stMartin: "St Martin's Day",
    stLucia: "St Lucy's Day",
    germanUnityDay: 'German Unity Day',
    austrianNationalDay: 'Austrian National Day',
    liechtensteinNationalDay: 'Liechtenstein National Day',
    bastilleDay: 'Bastille Day',
    italianRepublicDay: 'Republic Day (Italy)',
    spanishNationalDay: 'Spanish National Day',
    kingsDay: "King's Day",
    independenceDayUS: 'Independence Day',
    canadaDay: 'Canada Day',
    mexicanIndependenceDay: 'Mexican Independence Day',
    brazilIndependenceDay: 'Brazilian Independence Day',
    australiaDay: 'Australia Day',
    waitangiDay: 'Waitangi Day',
    indianIndependenceDay: 'Independence Day (India)',
    polishIndependenceDay: 'Polish Independence Day',
    ukrainianIndependenceDay: 'Ukrainian Independence Day',
    constitutionDayNO: 'Norwegian Constitution Day',
    thanksgiving: 'Thanksgiving',
    guyFawkesNight: 'Guy Fawkes Night',
    dayOfTheDead: 'Day of the Dead',
    childrensDay: "Children's Day",
    tanabata: 'Tanabata',
    hanami: 'Cherry blossom season',
    lunarNewYear: 'Lunar New Year',
    midAutumn: 'Mid-Autumn Festival',
    nowruz: 'Nowruz',
    ramadan: 'Ramadan',
    eidAlFitr: 'Eid al-Fitr',
    eidAlAdha: 'Eid al-Adha',
    hanukkah: 'Hanukkah',
    diwali: 'Diwali',
    holi: 'Holi',
    vesak: 'Vesak',
    kwanzaa: 'Kwanzaa',
  },

  weather: { clear: 'clear', sunset: 'sunset', fog: 'fog', magic: 'magic' },
  falling: { always: 'always', burst: 'a few seconds after each change', freeze: 'a few seconds after each change, then frozen in mid-air', off: 'off' },
  fallingSet: mode => `Falling: ${mode}. Remembered for your next sessions.`,
  layoutSet: (f, m) => `Figure at ${f} %, moon at ${m} % of the window width. Remembered for your next sessions.`,
  regionLine: (r, how, tz, h) => `Region: ${r} (${how}) · ${tz} · ${h === 'south' ? 'southern' : 'northern'} hemisphere`,
  regionHow: { setting: 'set', zone: z => `detected via ${z}`, locale: l => `detected from locale ${l}`, legacy: 'from the old location setting', none: 'not detected, global occasions only' },
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
    orthodoxEaster: 'Orthodoxe Ostern',
    sechselaeuten: 'Sechseläuten',
    labourDay: 'Tag der Arbeit',
    mothersDay: 'Muttertag',
    fathersDay: 'Vatertag',
    ascension: 'Auffahrt',
    pentecost: 'Pfingsten',
    solstice: 'Sommersonnenwende',
    midsummer: 'Mittsommer',
    swissNationalDay: '1. August',
    halloween: 'Halloween',
    stNicholas: 'St. Nikolaus',
    advent: 'Advent',
    christmas: 'Weihnachten',
    boxingDay: 'Boxing Day',
    newYearsEve: 'Silvester',
    newYear: 'Neujahr',
    epiphany: 'Dreikönigstag',
    stPatricksDay: "St. Patrick's Day",
    stMartin: 'Martinstag',
    stLucia: 'Luciafest',
    germanUnityDay: 'Tag der Deutschen Einheit',
    austrianNationalDay: 'Österreichischer Nationalfeiertag',
    liechtensteinNationalDay: 'Staatsfeiertag Liechtenstein',
    bastilleDay: 'Französischer Nationalfeiertag',
    italianRepublicDay: 'Tag der Republik (Italien)',
    spanishNationalDay: 'Spanischer Nationalfeiertag',
    kingsDay: 'Königstag',
    independenceDayUS: 'Unabhängigkeitstag (USA)',
    canadaDay: 'Canada Day',
    mexicanIndependenceDay: 'Unabhängigkeitstag Mexikos',
    brazilIndependenceDay: 'Unabhängigkeitstag Brasiliens',
    australiaDay: 'Australia Day',
    waitangiDay: 'Waitangi-Tag',
    indianIndependenceDay: 'Unabhängigkeitstag Indiens',
    polishIndependenceDay: 'Unabhängigkeitstag Polens',
    ukrainianIndependenceDay: 'Unabhängigkeitstag der Ukraine',
    constitutionDayNO: 'Norwegischer Nationalfeiertag',
    thanksgiving: 'Thanksgiving',
    guyFawkesNight: 'Guy-Fawkes-Nacht',
    dayOfTheDead: 'Tag der Toten',
    childrensDay: 'Kindertag',
    tanabata: 'Tanabata',
    hanami: 'Kirschblütenzeit',
    lunarNewYear: 'Chinesisches Neujahr',
    midAutumn: 'Mondfest',
    nowruz: 'Nouruz',
    ramadan: 'Ramadan',
    eidAlFitr: 'Zuckerfest',
    eidAlAdha: 'Opferfest',
    hanukkah: 'Chanukka',
    diwali: 'Diwali',
    holi: 'Holi',
    vesak: 'Vesakh',
    kwanzaa: 'Kwanzaa',
  },

  weather: { clear: 'klar', sunset: 'Abendrot', fog: 'Nebel', magic: 'Zauber' },
  falling: { always: 'immer', burst: 'ein paar Sekunden nach jeder Änderung', freeze: 'ein paar Sekunden nach jeder Änderung, dann bleibt alles in der Luft stehen', off: 'aus' },
  fallingSet: mode => `Fallen: ${mode}. Wird für die nächsten Sitzungen gemerkt.`,
  layoutSet: (f, m) => `Figur bei ${f} %, Mond bei ${m} % der Fensterbreite. Wird für die nächsten Sitzungen gemerkt.`,
  regionLine: (r, how, tz, h) => `Region: ${r} (${how}) · ${tz} · ${h === 'south' ? 'Südhalbkugel' : 'Nordhalbkugel'}`,
  regionHow: { setting: 'eingestellt', zone: z => `erkannt über ${z}`, locale: l => `erkannt über die Locale ${l}`, legacy: 'aus der alten Einstellung location', none: 'nicht erkannt, nur globale Anlässe' },
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

// ── words for /backdrop ───────────────────────────────────────────────────

/** Words /backdrop understands in one language. Every language's words work, whatever the setting. */
export type Words = {
  occasions: Partial<Record<Occasion, string[]>>
  seasons: Record<Season, string[]>
}

export const WORDS: Record<'en' | 'de', Words> = {
  en: {
    seasons: { winter: ['winter'], firstSnow: ['firstsnow'], thaw: ['thaw'], spring: ['spring'], summer: ['summer'], autumn: ['autumn', 'fall'] },
    occasions: {
      valentinesDay: ['valentine', 'valentinesday'], carnival: ['carnival'], womensDay: ['womensday'], easter: ['easter'],
      orthodoxEaster: ['orthodoxeaster'], sechselaeuten: ['sechselaeuten', 'boeoegg'], labourDay: ['labourday', 'laborday', 'mayday'],
      mothersDay: ['mothersday'], fathersDay: ['fathersday'], ascension: ['ascension'], pentecost: ['pentecost', 'whitsun'],
      solstice: ['solstice'], midsummer: ['midsummer'], swissNationalDay: ['nationalday', 'swissnationalday', 'august1'],
      halloween: ['halloween'], stNicholas: ['stnicholas', 'nicholas'], advent: ['advent'], christmas: ['christmas'],
      boxingDay: ['boxingday'], newYearsEve: ['newyearseve'], newYear: ['newyear'], epiphany: ['epiphany'],
      stPatricksDay: ['stpatricksday', 'stpatrick'], stMartin: ['stmartin'], stLucia: ['stlucia', 'lucia'],
      germanUnityDay: ['germanunityday'], austrianNationalDay: ['austriannationalday'], liechtensteinNationalDay: ['liechtensteinnationalday'],
      bastilleDay: ['bastilleday'], italianRepublicDay: ['italianrepublicday'], spanishNationalDay: ['spanishnationalday'],
      kingsDay: ['kingsday', 'koningsdag'], independenceDayUS: ['independenceday', 'fourthofjuly', 'july4'], canadaDay: ['canadaday'],
      mexicanIndependenceDay: ['mexicanindependenceday'], brazilIndependenceDay: ['brazilindependenceday'], australiaDay: ['australiaday'],
      waitangiDay: ['waitangiday'], indianIndependenceDay: ['indianindependenceday'], polishIndependenceDay: ['polishindependenceday'],
      ukrainianIndependenceDay: ['ukrainianindependenceday'], constitutionDayNO: ['syttendemai', 'norwegianconstitutionday'],
      thanksgiving: ['thanksgiving'], guyFawkesNight: ['guyfawkesnight', 'bonfirenight'], dayOfTheDead: ['dayofthedead', 'diademuertos'],
      childrensDay: ['childrensday', 'kodomonohi'], tanabata: ['tanabata'], hanami: ['hanami', 'cherryblossom'],
      lunarNewYear: ['lunarnewyear', 'chinesenewyear'], midAutumn: ['midautumn', 'mooncake'], nowruz: ['nowruz'],
      ramadan: ['ramadan'], eidAlFitr: ['eidalfitr', 'eid'], eidAlAdha: ['eidaladha'], hanukkah: ['hanukkah', 'chanukah'],
      diwali: ['diwali', 'deepavali'], holi: ['holi'], vesak: ['vesak', 'wesak'], kwanzaa: ['kwanzaa'],
    },
  },
  de: {
    seasons: { winter: ['winter'], firstSnow: ['ersterschnee'], thaw: ['tauwetter', 'schmelze'], spring: ['frühling'], summer: ['sommer'], autumn: ['herbst'] },
    occasions: {
      valentinesDay: ['valentinstag'], carnival: ['fasnacht', 'fasching', 'karneval'], womensDay: ['tagderfrau', 'frauentag'], easter: ['ostern'],
      orthodoxEaster: ['orthodoxeostern'], sechselaeuten: ['sechseläuten', 'böögg'], labourDay: ['tagderarbeit'], mothersDay: ['muttertag'],
      fathersDay: ['vatertag'], ascension: ['auffahrt', 'himmelfahrt'], pentecost: ['pfingsten'], solstice: ['sonnenwende', 'sommersonnenwende'],
      midsummer: ['mittsommer'], swissNationalDay: ['nationalfeiertag', 'bundesfeier'], stNicholas: ['nikolaus', 'samichlaus'],
      christmas: ['weihnachten'], boxingDay: ['stephanstag'], newYearsEve: ['silvester'], newYear: ['neujahr'], epiphany: ['dreikönigstag', 'dreikönige'],
      stMartin: ['martinstag', 'martini'], stLucia: ['luciafest'], germanUnityDay: ['tagderdeutscheneinheit', 'einheit'],
      austrianNationalDay: ['österreich'], liechtensteinNationalDay: ['staatsfeiertag'], bastilleDay: ['frankreich'],
      italianRepublicDay: ['festadellarepubblica'], spanishNationalDay: ['spanien'], kingsDay: ['königstag'],
      independenceDayUS: ['unabhängigkeitstag'], dayOfTheDead: ['tagdertoten'], childrensDay: ['kindertag'],
      hanami: ['kirschblüte'], lunarNewYear: ['chinesischesneujahr', 'neujahrsfest'], midAutumn: ['mondfest'], nowruz: ['nouruz'],
      eidAlFitr: ['zuckerfest'], eidAlAdha: ['opferfest'], hanukkah: ['chanukka'], vesak: ['vesakh'], thanksgiving: ['erntedank'],
    },
  },
}

/** Lower case without accents, so 'pâques' = 'paques' and 'Frühling' = 'fruhling'. */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
