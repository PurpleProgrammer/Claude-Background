// Every text the mod shows, in English (primary), German, French, Italian and
// Spanish, with regional variants (de-CH, fr-CH, it-CH, en-US …), and the words
// /backdrop understands in each language. SETTINGS.language picks the texts;
// 'auto' takes the language of the system's locale. Dates and percentages come
// from Intl, so each language gets its own format (French puts a narrow space
// before %).
//
// A new text goes into the Texts type and into every language below; the
// Record<Language, Texts> type makes a missing one fail the type check.

import { region } from './context.js'
import { localeLanguage } from './detect.js'
import { SETTINGS, type FallingMode, type Weather } from './settings.js'

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

/** The languages the mod speaks. */
export type Language = 'en' | 'de' | 'fr' | 'it' | 'es'
export const LANGUAGES: readonly Language[] = ['en', 'de', 'fr', 'it', 'es']

export type CommandWord = 'date' | 'weather' | 'context' | 'reset' | 'help' | 'falling' | 'figure' | 'moon' | 'layout' | 'region' | 'occasions' | 'cheer' | 'fright' | 'language'

type HelpText = Record<'title' | 'show' | 'seasonOrOccasion' | 'date' | 'weather' | 'context' | 'moods' | 'falling' | 'place' | 'layout' | 'region' | 'occasions' | 'language' | 'reset' | 'help' | 'more', string>

type Texts = {
  locale: string
  seasons: Record<Season, string>
  occasions: Record<Occasion, string>
  weather: Record<Weather, string>
  falling: Record<FallingMode, string>
  contextShare: (percent: number) => string
  fallingSet: (mode: string) => string
  layoutSet: (figure: number, moon: number) => string
  regionLine: (region: string, how: string, timeZone: string, hemisphere: string) => string
  regionUsage: string
  occasionsHeader: (region: string) => string
  occasionsNone: string
  regionHow: { setting: string; zone: (zone: string) => string; locale: (locale: string) => string; legacy: string; none: string }
  layoutUsage: string
  loadingModel: string
  unknownModel: string
  newYearGreeting: string
  alt: (season: string, percent: number, model: string) => string
  commandDescription: string
  helpText: HelpText
  date: (y: number, m: number, d: number) => string
  labels: { date: string; season: string; occasion: string; model: string; weather: string; context: string; accessories: string; falling: string; layout: string }
  preview: string
  accessories: { hat: string; scarf: string; broom: string; none: string }
  previewEnded: string
  dateUsage: string
  unknown: (args: string) => string
  previewHint: string
  languageSet: (name: string) => string
  languageUsage: string
  cheer: string
  fright: string
}

/** "32 %" in the language's own format; plain digits where Intl is missing. */
function percent(lang: string, p: number): string {
  try {
    return new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 0 }).format(p / 100)
  } catch {
    return `${p}%`
  }
}

/** A calendar date in the language's own format; ISO where Intl is missing. */
function formatDate(lang: string, y: number, m: number, d: number): string {
  try {
    return new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
  } catch {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
}

const EN: Texts = {
  locale: "en",
  seasons: {"winter": "Winter", "thaw": "Thaw", "firstSnow": "First snow", "spring": "Spring", "summer": "Summer", "autumn": "Autumn"},
  occasions: {
    valentinesDay: "Valentine's Day",
    carnival: "Carnival",
    womensDay: "International Women's Day",
    easter: "Easter",
    orthodoxEaster: "Orthodox Easter",
    sechselaeuten: "Sechseläuten",
    labourDay: "Labour Day",
    mothersDay: "Mother's Day",
    fathersDay: "Father's Day",
    ascension: "Ascension Day",
    pentecost: "Pentecost",
    solstice: "Summer solstice",
    midsummer: "Midsummer",
    swissNationalDay: "Swiss National Day",
    halloween: "Halloween",
    stNicholas: "St Nicholas Day",
    advent: "Advent",
    christmas: "Christmas",
    boxingDay: "Boxing Day",
    newYearsEve: "New Year's Eve",
    newYear: "New Year",
    epiphany: "Epiphany",
    stPatricksDay: "St Patrick's Day",
    stMartin: "St Martin's Day",
    stLucia: "St Lucy's Day",
    germanUnityDay: "German Unity Day",
    austrianNationalDay: "Austrian National Day",
    liechtensteinNationalDay: "Liechtenstein National Day",
    bastilleDay: "Bastille Day",
    italianRepublicDay: "Republic Day (Italy)",
    spanishNationalDay: "Spanish National Day",
    kingsDay: "King's Day",
    independenceDayUS: "Independence Day",
    canadaDay: "Canada Day",
    mexicanIndependenceDay: "Mexican Independence Day",
    brazilIndependenceDay: "Brazilian Independence Day",
    australiaDay: "Australia Day",
    waitangiDay: "Waitangi Day",
    indianIndependenceDay: "Independence Day (India)",
    polishIndependenceDay: "Polish Independence Day",
    ukrainianIndependenceDay: "Ukrainian Independence Day",
    constitutionDayNO: "Norwegian Constitution Day",
    thanksgiving: "Thanksgiving",
    guyFawkesNight: "Guy Fawkes Night",
    dayOfTheDead: "Day of the Dead",
    childrensDay: "Children's Day",
    tanabata: "Tanabata",
    hanami: "Cherry blossom season",
    lunarNewYear: "Lunar New Year",
    midAutumn: "Mid-Autumn Festival",
    nowruz: "Nowruz",
    ramadan: "Ramadan",
    eidAlFitr: "Eid al-Fitr",
    eidAlAdha: "Eid al-Adha",
    hanukkah: "Hanukkah",
    diwali: "Diwali",
    holi: "Holi",
    vesak: "Vesak",
    kwanzaa: "Kwanzaa",
  },
  weather: {"clear": "clear", "sunset": "sunset", "fog": "fog", "magic": "magic"},
  falling: {"always": "always", "burst": "a few seconds after each change", "freeze": "a few seconds after each change, then frozen in mid-air", "off": "off"},
  contextShare: p => `${percent("en", p)} context`,
  fallingSet: mode => `Falling: ${mode}. Remembered for your next sessions.`,
  layoutSet: (f, m) => `Figure at ${f} %, moon at ${m} % of the window width. Remembered for your next sessions.`,
  regionLine: (r, how, tz, h) => `Region: ${r} (${how}) · ${tz} · ${h === 'south' ? "southern hemisphere" : "northern hemisphere"}`,
  regionUsage: "Usage: /backdrop region DE (a two-letter country code) or /backdrop region auto",
  occasionsHeader: r => `Occasions for ${r}, with their next date:`,
  occasionsNone: "No occasions here.",
  regionHow: { setting: "set", zone: z => `detected via ${z}`, locale: l => `detected from locale ${l}`, legacy: "from the old location setting", none: "not detected, global occasions only" },
  layoutUsage: "Usage: /backdrop figure 20 · /backdrop moon 85 · /backdrop layout reset",
  loadingModel: "Loading model",
  unknownModel: "unknown",
  newYearGreeting: "Happy New Year!",
  alt: (season, p, model) => `Landscape (${season}), context ${percent("en", p)} full, model ${model}`,
  commandDescription: "Interactive background: preview seasons, occasions, weather, context and moods",
  helpText: {"title": "Interactive background (/backdrop or /winter):", "show": "show the current state", "seasonOrOccasion": "preview a season or occasion, e.g.", "date": "any date", "weather": "weather", "context": "simulate how full the context is", "moods": "let the figure cheer or get a fright", "falling": "fall always, for a few seconds then clear, for a few seconds then freeze, or never", "place": "move the figure or the moon (percent of the window width)", "layout": "back to the positions in the settings", "region": "another country's occasions, or detect it again", "occasions": "the occasions here with their next date", "reset": "end all previews", "language": "language of the texts, or auto", "help": "this help", "more": "Words in English, German, French, Italian and Spanish all work."},
  date: (y, m, d) => formatDate("en", y, m, d),
  labels: {"date": "Date", "season": "Season", "occasion": "Occasion", "model": "Model", "weather": "Weather", "context": "Context", "accessories": "Accessories", "falling": "Falling", "layout": "Layout"},
  preview: "(preview)",
  accessories: {"hat": "hat", "scarf": "scarf", "broom": "broom and mittens", "none": "none yet"},
  previewEnded: "Preview ended.",
  dateUsage: "Usage: /backdrop date 2027-03-20",
  unknown: args => `Unknown: "${args}".`,
  previewHint: "Preview active: /backdrop reset goes back to today.",
  languageSet: name => `Language: ${name}. Remembered for your next sessions.`,
  languageUsage: "Usage: /backdrop language en|de|fr|it|es|auto",
  cheer: "The figure cheers.",
  fright: "The figure gets a fright.",
}

const DE: Texts = {
  locale: "de",
  seasons: {"winter": "Winter", "thaw": "Tauwetter", "firstSnow": "Erster Schnee", "spring": "Frühling", "summer": "Sommer", "autumn": "Herbst"},
  occasions: {
    valentinesDay: "Valentinstag",
    carnival: "Fasnacht",
    womensDay: "Tag der Frau",
    easter: "Ostern",
    orthodoxEaster: "Orthodoxe Ostern",
    sechselaeuten: "Sechseläuten",
    labourDay: "Tag der Arbeit",
    mothersDay: "Muttertag",
    fathersDay: "Vatertag",
    ascension: "Auffahrt",
    pentecost: "Pfingsten",
    solstice: "Sommersonnenwende",
    midsummer: "Mittsommer",
    swissNationalDay: "1. August",
    halloween: "Halloween",
    stNicholas: "St. Nikolaus",
    advent: "Advent",
    christmas: "Weihnachten",
    boxingDay: "Boxing Day",
    newYearsEve: "Silvester",
    newYear: "Neujahr",
    epiphany: "Dreikönigstag",
    stPatricksDay: "St. Patrick's Day",
    stMartin: "Martinstag",
    stLucia: "Luciafest",
    germanUnityDay: "Tag der Deutschen Einheit",
    austrianNationalDay: "Österreichischer Nationalfeiertag",
    liechtensteinNationalDay: "Staatsfeiertag Liechtenstein",
    bastilleDay: "Französischer Nationalfeiertag",
    italianRepublicDay: "Tag der Republik (Italien)",
    spanishNationalDay: "Spanischer Nationalfeiertag",
    kingsDay: "Königstag",
    independenceDayUS: "Unabhängigkeitstag (USA)",
    canadaDay: "Canada Day",
    mexicanIndependenceDay: "Unabhängigkeitstag Mexikos",
    brazilIndependenceDay: "Unabhängigkeitstag Brasiliens",
    australiaDay: "Australia Day",
    waitangiDay: "Waitangi-Tag",
    indianIndependenceDay: "Unabhängigkeitstag Indiens",
    polishIndependenceDay: "Unabhängigkeitstag Polens",
    ukrainianIndependenceDay: "Unabhängigkeitstag der Ukraine",
    constitutionDayNO: "Norwegischer Nationalfeiertag",
    thanksgiving: "Thanksgiving",
    guyFawkesNight: "Guy-Fawkes-Nacht",
    dayOfTheDead: "Tag der Toten",
    childrensDay: "Kindertag",
    tanabata: "Tanabata",
    hanami: "Kirschblütenzeit",
    lunarNewYear: "Chinesisches Neujahr",
    midAutumn: "Mondfest",
    nowruz: "Nouruz",
    ramadan: "Ramadan",
    eidAlFitr: "Zuckerfest",
    eidAlAdha: "Opferfest",
    hanukkah: "Chanukka",
    diwali: "Diwali",
    holi: "Holi",
    vesak: "Vesakh",
    kwanzaa: "Kwanzaa",
  },
  weather: {"clear": "klar", "sunset": "Abendrot", "fog": "Nebel", "magic": "Zauber"},
  falling: {"always": "immer", "burst": "ein paar Sekunden nach jeder Änderung", "freeze": "ein paar Sekunden nach jeder Änderung, dann bleibt alles in der Luft stehen", "off": "aus"},
  contextShare: p => `${percent("de", p)} Kontext`,
  fallingSet: mode => `Fallen: ${mode}. Wird für die nächsten Sitzungen gemerkt.`,
  layoutSet: (f, m) => `Figur bei ${f} %, Mond bei ${m} % der Fensterbreite. Wird für die nächsten Sitzungen gemerkt.`,
  regionLine: (r, how, tz, h) => `Region: ${r} (${how}) · ${tz} · ${h === 'south' ? "Südhalbkugel" : "Nordhalbkugel"}`,
  regionUsage: "Bitte so: /backdrop region DE (Ländercode mit zwei Buchstaben) oder /backdrop region auto",
  occasionsHeader: r => `Anlässe für ${r}, mit ihrem nächsten Datum:`,
  occasionsNone: "Hier gibt es keine Anlässe.",
  regionHow: { setting: "eingestellt", zone: z => `erkannt über ${z}`, locale: l => `erkannt über die Locale ${l}`, legacy: "aus der alten Einstellung location", none: "nicht erkannt, nur globale Anlässe" },
  layoutUsage: "Bitte so: /backdrop figur 20 · /backdrop mond 85 · /backdrop anordnung zurück",
  loadingModel: "Modell wird geladen",
  unknownModel: "unbekannt",
  newYearGreeting: "Frohes neues Jahr!",
  alt: (season, p, model) => `Landschaft (${season}), Kontext zu ${percent("de", p)} gefüllt, Modell ${model}`,
  commandDescription: "Interaktiver Hintergrund: Vorschau von Jahreszeiten, Anlässen, Wetter, Kontext und Stimmungen",
  helpText: {"title": "Interaktiver Hintergrund (/backdrop oder /winter):", "show": "zeigt den aktuellen Zustand", "seasonOrOccasion": "Jahreszeit oder Anlass ansehen, z. B.", "date": "beliebiges Datum", "weather": "Wetter", "context": "Kontext-Füllstand simulieren", "moods": "Figur jubeln oder erschrecken lassen", "falling": "immer, ein paar Sekunden und dann klar, ein paar Sekunden und dann eingefroren, oder nie", "place": "Figur oder Mond verschieben (Prozent der Fensterbreite)", "layout": "zurück zu den Positionen aus den Einstellungen", "region": "Anlässe eines anderen Landes zeigen oder wieder erkennen", "occasions": "die Anlässe hier mit ihrem nächsten Datum", "reset": "alle Vorschauen beenden", "language": "Sprache der Texte, oder auto", "help": "diese Hilfe", "more": "Wörter auf Englisch, Deutsch, Französisch, Italienisch und Spanisch funktionieren alle."},
  date: (y, m, d) => formatDate("de", y, m, d),
  labels: {"date": "Datum", "season": "Jahreszeit", "occasion": "Anlass", "model": "Modell", "weather": "Wetter", "context": "Kontext", "accessories": "Accessoires", "falling": "Fallen", "layout": "Anordnung"},
  preview: "(Vorschau)",
  accessories: {"hat": "Mütze", "scarf": "Schal", "broom": "Besen und Fäustlinge", "none": "noch keine"},
  previewEnded: "Vorschau beendet.",
  dateUsage: "Bitte so: /backdrop datum 2027-03-20",
  unknown: args => `Unbekannt: «${args}».`,
  previewHint: "Vorschau aktiv: /backdrop zurück kehrt zu heute zurück.",
  languageSet: name => `Sprache: ${name}. Wird für die nächsten Sitzungen gemerkt.`,
  languageUsage: "Bitte so: /backdrop sprache en|de|fr|it|es|auto",
  cheer: "Die Figur jubelt.",
  fright: "Die Figur erschrickt.",
}

const FR: Texts = {
  locale: "fr",
  seasons: {"winter": "Hiver", "thaw": "Dégel", "firstSnow": "Premières neiges", "spring": "Printemps", "summer": "Été", "autumn": "Automne"},
  occasions: {
    valentinesDay: "Saint-Valentin",
    carnival: "Carnaval",
    womensDay: "Journée internationale des droits des femmes",
    easter: "Pâques",
    orthodoxEaster: "Pâques orthodoxe",
    sechselaeuten: "Sechseläuten",
    labourDay: "Fête du Travail",
    mothersDay: "Fête des mères",
    fathersDay: "Fête des pères",
    ascension: "Ascension",
    pentecost: "Pentecôte",
    solstice: "Solstice d'été",
    midsummer: "Midsommar",
    swissNationalDay: "Fête nationale suisse",
    halloween: "Halloween",
    stNicholas: "Saint-Nicolas",
    advent: "Avent",
    christmas: "Noël",
    boxingDay: "Boxing Day",
    newYearsEve: "Saint-Sylvestre",
    newYear: "Nouvel An",
    epiphany: "Épiphanie",
    stPatricksDay: "Saint-Patrick",
    stMartin: "Saint-Martin",
    stLucia: "Sainte-Lucie",
    germanUnityDay: "Fête de l'Unité allemande",
    austrianNationalDay: "Fête nationale autrichienne",
    liechtensteinNationalDay: "Fête nationale du Liechtenstein",
    bastilleDay: "Fête nationale (14 Juillet)",
    italianRepublicDay: "Fête de la République italienne",
    spanishNationalDay: "Fête nationale espagnole",
    kingsDay: "Fête du Roi",
    independenceDayUS: "Fête de l'Indépendance (États-Unis)",
    canadaDay: "Fête du Canada",
    mexicanIndependenceDay: "Fête de l'Indépendance du Mexique",
    brazilIndependenceDay: "Fête de l'Indépendance du Brésil",
    australiaDay: "Fête nationale de l'Australie",
    waitangiDay: "Waitangi Day",
    indianIndependenceDay: "Fête de l'Indépendance de l'Inde",
    polishIndependenceDay: "Fête de l'Indépendance de la Pologne",
    ukrainianIndependenceDay: "Fête de l'Indépendance de l'Ukraine",
    constitutionDayNO: "Fête nationale norvégienne",
    thanksgiving: "Thanksgiving",
    guyFawkesNight: "Nuit de Guy Fawkes",
    dayOfTheDead: "Jour des Morts",
    childrensDay: "Fête des enfants",
    tanabata: "Tanabata",
    hanami: "Saison des cerisiers en fleurs",
    lunarNewYear: "Nouvel An lunaire",
    midAutumn: "Fête de la mi-automne",
    nowruz: "Norouz",
    ramadan: "Ramadan",
    eidAlFitr: "Aïd el-Fitr",
    eidAlAdha: "Aïd el-Kébir",
    hanukkah: "Hanoukka",
    diwali: "Diwali",
    holi: "Holi",
    vesak: "Vesak",
    kwanzaa: "Kwanzaa",
  },
  weather: {"clear": "dégagé", "sunset": "crépuscule", "fog": "brouillard", "magic": "magie"},
  falling: {"always": "en continu", "burst": "quelques secondes après chaque changement", "freeze": "quelques secondes après chaque changement, puis tout se fige en l’air", "off": "désactivée"},
  contextShare: p => `${percent("fr", p)} de contexte`,
  fallingSet: mode => `Chute : ${mode}. Réglage mémorisé pour les prochaines sessions.`,
  layoutSet: (f, m) => `Personnage à ${f} %, lune à ${m} % de la largeur de la fenêtre. Réglage mémorisé pour les prochaines sessions.`,
  regionLine: (r, how, tz, h) => `Région: ${r} (${how}) · ${tz} · ${h === 'south' ? "hémisphère sud" : "hémisphère nord"}`,
  regionUsage: "Utilisation : /backdrop région FR (code pays à deux lettres) ou /backdrop région auto",
  occasionsHeader: r => `Fêtes pour ${r}, avec leur prochaine date :`,
  occasionsNone: "Aucune fête ici.",
  regionHow: { setting: "défini", zone: z => `détecté via ${z}`, locale: l => `détecté d’après les paramètres régionaux ${l}`, legacy: "d’après l’ancien réglage location", none: "non détecté, fêtes mondiales uniquement" },
  layoutUsage: "Utilisation : /backdrop personnage 20 · /backdrop lune 85 · /backdrop disposition réinitialiser",
  loadingModel: "Chargement du modèle",
  unknownModel: "inconnu",
  newYearGreeting: "Bonne année !",
  alt: (season, p, model) => `Paysage (${season}), contexte rempli à ${percent("fr", p)}, modèle ${model}`,
  commandDescription: "Arrière-plan interactif : aperçu des saisons, des fêtes, de la météo, du contexte et des humeurs",
  helpText: {"title": "Arrière-plan interactif (/backdrop ou /winter) :", "show": "affiche l’état actuel", "seasonOrOccasion": "aperçu d’une saison ou d’une fête, p. ex.", "date": "une date au choix", "weather": "météo", "context": "simuler le remplissage du contexte", "moods": "faire exulter ou sursauter le personnage", "falling": "en continu, quelques secondes puis ciel dégagé, quelques secondes puis figé, ou jamais", "place": "déplacer le personnage ou la lune (pourcentage de la largeur de la fenêtre)", "layout": "revenir aux positions des réglages", "region": "les fêtes d’un autre pays, ou nouvelle détection", "occasions": "les fêtes d’ici avec leur prochaine date", "reset": "terminer tous les aperçus", "language": "langue des textes, ou auto", "help": "cette aide", "more": "Les mots en anglais, allemand, français, italien et espagnol fonctionnent tous."},
  date: (y, m, d) => formatDate("fr", y, m, d),
  labels: {"date": "Date", "season": "Saison", "occasion": "Fête", "model": "Modèle", "weather": "Météo", "context": "Contexte", "accessories": "Accessoires", "falling": "Chute", "layout": "Disposition"},
  preview: "(aperçu)",
  accessories: {"hat": "bonnet", "scarf": "écharpe", "broom": "balai et moufles", "none": "aucun pour l’instant"},
  previewEnded: "Aperçu terminé.",
  dateUsage: "Utilisation : /backdrop date 2027-03-20",
  unknown: args => `Inconnu : « ${args} ».`,
  previewHint: "Aperçu actif : /backdrop réinitialiser revient à aujourd’hui.",
  languageSet: name => `Langue : ${name}. Réglage mémorisé pour les prochaines sessions.`,
  languageUsage: "Utilisation : /backdrop langue en|de|fr|it|es|auto",
  cheer: "Le personnage exulte.",
  fright: "Le personnage sursaute.",
}

const IT: Texts = {
  locale: "it",
  seasons: {"winter": "Inverno", "thaw": "Disgelo", "firstSnow": "Prima neve", "spring": "Primavera", "summer": "Estate", "autumn": "Autunno"},
  occasions: {
    valentinesDay: "San Valentino",
    carnival: "Carnevale",
    womensDay: "Giornata internazionale della donna",
    easter: "Pasqua",
    orthodoxEaster: "Pasqua ortodossa",
    sechselaeuten: "Sechseläuten",
    labourDay: "Festa dei lavoratori",
    mothersDay: "Festa della mamma",
    fathersDay: "Festa del papà",
    ascension: "Ascensione",
    pentecost: "Pentecoste",
    solstice: "Solstizio d'estate",
    midsummer: "Midsommar",
    swissNationalDay: "Festa nazionale svizzera",
    halloween: "Halloween",
    stNicholas: "San Nicola",
    advent: "Avvento",
    christmas: "Natale",
    boxingDay: "Boxing Day",
    newYearsEve: "San Silvestro",
    newYear: "Capodanno",
    epiphany: "Epifania",
    stPatricksDay: "San Patrizio",
    stMartin: "San Martino",
    stLucia: "Santa Lucia",
    germanUnityDay: "Giorno dell'unità tedesca",
    austrianNationalDay: "Festa nazionale austriaca",
    liechtensteinNationalDay: "Festa nazionale del Liechtenstein",
    bastilleDay: "Festa nazionale francese",
    italianRepublicDay: "Festa della Repubblica",
    spanishNationalDay: "Festa nazionale spagnola",
    kingsDay: "Festa del Re",
    independenceDayUS: "Giorno dell'indipendenza (USA)",
    canadaDay: "Festa del Canada",
    mexicanIndependenceDay: "Indipendenza del Messico",
    brazilIndependenceDay: "Indipendenza del Brasile",
    australiaDay: "Festa nazionale dell'Australia",
    waitangiDay: "Waitangi Day",
    indianIndependenceDay: "Indipendenza dell'India",
    polishIndependenceDay: "Indipendenza della Polonia",
    ukrainianIndependenceDay: "Indipendenza dell'Ucraina",
    constitutionDayNO: "Festa nazionale norvegese",
    thanksgiving: "Festa del Ringraziamento",
    guyFawkesNight: "Notte di Guy Fawkes",
    dayOfTheDead: "Giorno dei Morti",
    childrensDay: "Festa dei bambini",
    tanabata: "Tanabata",
    hanami: "Fioritura dei ciliegi",
    lunarNewYear: "Capodanno lunare",
    midAutumn: "Festa di metà autunno",
    nowruz: "Nowruz",
    ramadan: "Ramadan",
    eidAlFitr: "Eid al-Fitr",
    eidAlAdha: "Eid al-Adha",
    hanukkah: "Hanukkah",
    diwali: "Diwali",
    holi: "Holi",
    vesak: "Vesak",
    kwanzaa: "Kwanzaa",
  },
  weather: {"clear": "sereno", "sunset": "tramonto", "fog": "nebbia", "magic": "magia"},
  falling: {"always": "sempre", "burst": "qualche secondo dopo ogni cambiamento", "freeze": "qualche secondo dopo ogni cambiamento, poi tutto si ferma a mezz’aria", "off": "spenta"},
  contextShare: p => `${percent("it", p)} di contesto`,
  fallingSet: mode => `Caduta: ${mode}. Impostazione memorizzata per le prossime sessioni.`,
  layoutSet: (f, m) => `Personaggio al ${f} %, luna al ${m} % della larghezza della finestra. Impostazione memorizzata per le prossime sessioni.`,
  regionLine: (r, how, tz, h) => `Regione: ${r} (${how}) · ${tz} · ${h === 'south' ? "emisfero australe" : "emisfero boreale"}`,
  regionUsage: "Uso: /backdrop regione IT (codice paese di due lettere) oppure /backdrop regione auto",
  occasionsHeader: r => `Ricorrenze per ${r}, con la prossima data:`,
  occasionsNone: "Nessuna ricorrenza qui.",
  regionHow: { setting: "impostata", zone: z => `rilevata tramite ${z}`, locale: l => `rilevata dalle impostazioni locali ${l}`, legacy: "dalla vecchia impostazione location", none: "non rilevata, solo ricorrenze globali" },
  layoutUsage: "Uso: /backdrop personaggio 20 · /backdrop luna 85 · /backdrop disposizione ripristina",
  loadingModel: "Caricamento del modello",
  unknownModel: "sconosciuto",
  newYearGreeting: "Buon anno!",
  alt: (season, p, model) => `Paesaggio (${season}), contesto pieno al ${percent("it", p)}, modello ${model}`,
  commandDescription: "Sfondo interattivo: anteprima di stagioni, ricorrenze, meteo, contesto e stati d’animo",
  helpText: {"title": "Sfondo interattivo (/backdrop o /winter):", "show": "mostra lo stato attuale", "seasonOrOccasion": "anteprima di una stagione o ricorrenza, ad es.", "date": "una data qualsiasi", "weather": "meteo", "context": "simulare il riempimento del contesto", "moods": "far esultare o spaventare il personaggio", "falling": "sempre, qualche secondo e poi sereno, qualche secondo e poi fermo, oppure mai", "place": "spostare il personaggio o la luna (percentuale della larghezza della finestra)", "layout": "tornare alle posizioni delle impostazioni", "region": "le ricorrenze di un altro paese, o nuovo rilevamento", "occasions": "le ricorrenze di qui con la prossima data", "reset": "terminare tutte le anteprime", "language": "lingua dei testi, oppure auto", "help": "questo aiuto", "more": "Funzionano le parole in inglese, tedesco, francese, italiano e spagnolo."},
  date: (y, m, d) => formatDate("it", y, m, d),
  labels: {"date": "Data", "season": "Stagione", "occasion": "Ricorrenza", "model": "Modello", "weather": "Meteo", "context": "Contesto", "accessories": "Accessori", "falling": "Caduta", "layout": "Disposizione"},
  preview: "(anteprima)",
  accessories: {"hat": "berretto", "scarf": "sciarpa", "broom": "scopa e muffole", "none": "ancora nessuno"},
  previewEnded: "Anteprima terminata.",
  dateUsage: "Uso: /backdrop data 2027-03-20",
  unknown: args => `Sconosciuto: «${args}».`,
  previewHint: "Anteprima attiva: /backdrop ripristina torna a oggi.",
  languageSet: name => `Lingua: ${name}. Impostazione memorizzata per le prossime sessioni.`,
  languageUsage: "Uso: /backdrop lingua en|de|fr|it|es|auto",
  cheer: "Il personaggio esulta.",
  fright: "Il personaggio si spaventa.",
}

const ES: Texts = {
  locale: "es",
  seasons: {"winter": "Invierno", "thaw": "Deshielo", "firstSnow": "Primera nevada", "spring": "Primavera", "summer": "Verano", "autumn": "Otoño"},
  occasions: {
    valentinesDay: "San Valentín",
    carnival: "Carnaval",
    womensDay: "Día Internacional de la Mujer",
    easter: "Pascua",
    orthodoxEaster: "Pascua ortodoxa",
    sechselaeuten: "Sechseläuten",
    labourDay: "Día del Trabajo",
    mothersDay: "Día de la Madre",
    fathersDay: "Día del Padre",
    ascension: "Ascensión",
    pentecost: "Pentecostés",
    solstice: "Solsticio de verano",
    midsummer: "Midsommar",
    swissNationalDay: "Fiesta nacional suiza",
    halloween: "Halloween",
    stNicholas: "San Nicolás",
    advent: "Adviento",
    christmas: "Navidad",
    boxingDay: "Boxing Day",
    newYearsEve: "Nochevieja",
    newYear: "Año Nuevo",
    epiphany: "Día de Reyes",
    stPatricksDay: "San Patricio",
    stMartin: "San Martín",
    stLucia: "Santa Lucía",
    germanUnityDay: "Día de la Unidad Alemana",
    austrianNationalDay: "Fiesta nacional de Austria",
    liechtensteinNationalDay: "Fiesta nacional de Liechtenstein",
    bastilleDay: "Fiesta nacional de Francia",
    italianRepublicDay: "Fiesta de la República Italiana",
    spanishNationalDay: "Fiesta Nacional de España",
    kingsDay: "Día del Rey",
    independenceDayUS: "Día de la Independencia (EE. UU.)",
    canadaDay: "Día de Canadá",
    mexicanIndependenceDay: "Día de la Independencia de México",
    brazilIndependenceDay: "Independencia de Brasil",
    australiaDay: "Día de Australia",
    waitangiDay: "Día de Waitangi",
    indianIndependenceDay: "Independencia de la India",
    polishIndependenceDay: "Independencia de Polonia",
    ukrainianIndependenceDay: "Independencia de Ucrania",
    constitutionDayNO: "Día de la Constitución de Noruega",
    thanksgiving: "Día de Acción de Gracias",
    guyFawkesNight: "Noche de Guy Fawkes",
    dayOfTheDead: "Día de Muertos",
    childrensDay: "Día del Niño",
    tanabata: "Tanabata",
    hanami: "Temporada de cerezos en flor",
    lunarNewYear: "Año Nuevo Lunar",
    midAutumn: "Festival del Medio Otoño",
    nowruz: "Nowruz",
    ramadan: "Ramadán",
    eidAlFitr: "Eid al-Fitr",
    eidAlAdha: "Eid al-Adha",
    hanukkah: "Janucá",
    diwali: "Diwali",
    holi: "Holi",
    vesak: "Vesak",
    kwanzaa: "Kwanzaa",
  },
  weather: {"clear": "despejado", "sunset": "atardecer", "fog": "niebla", "magic": "magia"},
  falling: {"always": "siempre", "burst": "unos segundos tras cada cambio", "freeze": "unos segundos tras cada cambio y luego todo se queda quieto en el aire", "off": "desactivada"},
  contextShare: p => `${percent("es", p)} de contexto`,
  fallingSet: mode => `Caída: ${mode}. Se recordará en tus próximas sesiones.`,
  layoutSet: (f, m) => `Figura al ${f} %, luna al ${m} % del ancho de la ventana. Se recordará en tus próximas sesiones.`,
  regionLine: (r, how, tz, h) => `Región: ${r} (${how}) · ${tz} · ${h === 'south' ? "hemisferio sur" : "hemisferio norte"}`,
  regionUsage: "Uso: /backdrop región ES (código de país de dos letras) o /backdrop región auto",
  occasionsHeader: r => `Fiestas para ${r}, con su próxima fecha:`,
  occasionsNone: "Aquí no hay fiestas.",
  regionHow: { setting: "configurada", zone: z => `detectada mediante ${z}`, locale: l => `detectada por la configuración regional ${l}`, legacy: "del antiguo ajuste location", none: "no detectada, solo fiestas globales" },
  layoutUsage: "Uso: /backdrop figura 20 · /backdrop luna 85 · /backdrop disposición restablecer",
  loadingModel: "Cargando el modelo",
  unknownModel: "desconocido",
  newYearGreeting: "¡Feliz Año Nuevo!",
  alt: (season, p, model) => `Paisaje (${season}), contexto lleno al ${percent("es", p)}, modelo ${model}`,
  commandDescription: "Fondo interactivo: vista previa de estaciones, fiestas, tiempo, contexto y estados de ánimo",
  helpText: {"title": "Fondo interactivo (/backdrop o /winter):", "show": "muestra el estado actual", "seasonOrOccasion": "vista previa de una estación o fiesta, p. ej.", "date": "cualquier fecha", "weather": "tiempo", "context": "simular cuánto se ha llenado el contexto", "moods": "hacer que la figura lo celebre o se asuste", "falling": "siempre, unos segundos y luego despejado, unos segundos y luego quieto, o nunca", "place": "mover la figura o la luna (porcentaje del ancho de la ventana)", "layout": "volver a las posiciones de los ajustes", "region": "las fiestas de otro país, o volver a detectarlo", "occasions": "las fiestas de aquí con su próxima fecha", "reset": "terminar todas las vistas previas", "language": "idioma de los textos, o auto", "help": "esta ayuda", "more": "Funcionan las palabras en inglés, alemán, francés, italiano y español."},
  date: (y, m, d) => formatDate("es", y, m, d),
  labels: {"date": "Fecha", "season": "Estación", "occasion": "Fiesta", "model": "Modelo", "weather": "Tiempo", "context": "Contexto", "accessories": "Accesorios", "falling": "Caída", "layout": "Disposición"},
  preview: "(vista previa)",
  accessories: {"hat": "gorro", "scarf": "bufanda", "broom": "escoba y manoplas", "none": "ninguno todavía"},
  previewEnded: "Vista previa terminada.",
  dateUsage: "Uso: /backdrop fecha 2027-03-20",
  unknown: args => `Desconocido: «${args}».`,
  previewHint: "Vista previa activa: /backdrop restablecer vuelve a hoy.",
  languageSet: name => `Idioma: ${name}. Se recordará en tus próximas sesiones.`,
  languageUsage: "Uso: /backdrop idioma en|de|fr|it|es|auto",
  cheer: "La figura lo celebra.",
  fright: "La figura se asusta.",
}

const ALL: Record<Language, Texts> = { en: EN, de: DE, fr: FR, it: IT, es: ES }

type Variant = { occasions?: Partial<Record<Occasion, string>>; seasons?: Partial<Record<Season, string>>; newYearGreeting?: string }

/** Names and greetings that differ by country, keyed language-COUNTRY. */
const REGIONAL: Record<string, Variant> = {"de-CH": {"newYearGreeting": "Es guets Neus!"}, "de-LI": {"newYearGreeting": "Es guets Neus!"}, "de-AT": {"newYearGreeting": "Prosit Neujahr!"}, "fr-CH": {"occasions": {"swissNationalDay": "Fête nationale", "stNicholas": "Saint-Nicolas"}}, "fr-CA": {"occasions": {"thanksgiving": "Action de grâce", "canadaDay": "Fête du Canada"}}, "it-CH": {"occasions": {"swissNationalDay": "Festa nazionale", "stNicholas": "San Nicolao"}}, "en-US": {"occasions": {"labourDay": "Labor Day"}, "seasons": {"autumn": "Fall"}}, "en-CA": {"seasons": {"autumn": "Fall"}}}

/** The language for a setting: 'auto' takes the locale's language when the mod speaks it, else English. */
export function resolveLanguage(setting: string, locale: string): Language {
  if (setting !== 'auto') {
    return (LANGUAGES as readonly string[]).includes(setting) ? (setting as Language) : 'en'
  }
  const lang = localeLanguage(locale)
  return (LANGUAGES as readonly string[]).includes(lang) ? (lang as Language) : 'en'
}

let languageChoice: string | undefined

/** Use a language chosen with /backdrop (undefined goes back to the setting). */
export function chooseLanguage(choice: string | undefined): void {
  languageChoice = choice
}

/** The language in use: a choice made with /backdrop, else the setting. */
export function currentLanguage(): Language {
  return resolveLanguage(languageChoice ?? SETTINGS.language, region().env.locale)
}

/** A language's name in the language of the texts, e.g. 'fr' -> 'Französisch'. */
export function languageName(code: Language, inLanguage: Language): string {
  try {
    return new Intl.DisplayNames([inLanguage], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}

const cache = new Map<string, Texts>()

/** The texts in the language of the settings, with the region's variants. */
export function t(language: Language = currentLanguage()): Texts {
  const key = `${language}-${region().region}`
  const known = cache.get(key)
  if (known) {
    return known
  }
  const base = ALL[language]
  const variant = REGIONAL[key]
  const texts: Texts = variant
    ? {
        ...base,
        occasions: { ...base.occasions, ...variant.occasions },
        seasons: { ...base.seasons, ...variant.seasons },
        newYearGreeting: variant.newYearGreeting ?? base.newYearGreeting,
      }
    : base
  cache.set(key, texts)
  return texts
}

// ── words for /backdrop ───────────────────────────────────────────────────

/** Words /backdrop understands in one language. Every language's words work, whatever the setting. */
export type Words = {
  commands: Record<CommandWord, string[]>
  weather: Record<Weather, string[]>
  falling: Record<FallingMode, string[]>
  seasons: Record<Season, string[]>
  occasions: Partial<Record<Occasion, string[]>>
}

export const WORDS: Record<Language, Words> = {
  en: {
    commands: {"date": ["date"], "weather": ["weather"], "context": ["context"], "reset": ["reset"], "help": ["help"], "falling": ["falling"], "figure": ["figure"], "moon": ["moon"], "layout": ["layout"], "region": ["region"], "occasions": ["occasions"], "cheer": ["cheer"], "fright": ["fright"], "language": ["language"]},
    weather: {"clear": ["clear"], "sunset": ["sunset"], "fog": ["fog"], "magic": ["magic"]},
    falling: {"always": ["always"], "burst": ["burst", "short"], "freeze": ["freeze"], "off": ["off"]},
    seasons: {"winter": ["winter"], "firstSnow": ["firstsnow"], "thaw": ["thaw"], "spring": ["spring"], "summer": ["summer"], "autumn": ["autumn", "fall"]},
    occasions: {"valentinesDay": ["valentine"], "sechselaeuten": ["boeoegg"], "labourDay": ["laborday", "mayday"], "pentecost": ["whitsun"], "swissNationalDay": ["nationalday", "august1"], "stNicholas": ["nicholas"], "stPatricksDay": ["stpatrick"], "stLucia": ["lucia"], "kingsDay": ["koningsdag"], "independenceDayUS": ["independenceday", "fourthofjuly", "july4"], "constitutionDayNO": ["syttendemai"], "guyFawkesNight": ["bonfirenight"], "dayOfTheDead": ["diademuertos"], "childrensDay": ["kodomonohi"], "hanami": ["cherryblossom"], "lunarNewYear": ["chinesenewyear"], "midAutumn": ["mooncake"], "eidAlFitr": ["eid"], "hanukkah": ["chanukah"], "diwali": ["deepavali"], "vesak": ["wesak"]},
  },
  de: {
    commands: {"date": ["datum"], "weather": ["wetter"], "context": ["kontext"], "reset": ["zurück"], "help": ["hilfe"], "falling": ["fallen"], "figure": ["figur"], "moon": ["mond"], "layout": ["anordnung"], "region": ["region"], "occasions": ["anlässe"], "cheer": ["jubel"], "fright": ["schreck"], "language": ["sprache"]},
    weather: {"clear": ["klar"], "sunset": ["abendrot"], "fog": ["nebel"], "magic": ["zauber"]},
    falling: {"always": ["immer"], "burst": ["kurz"], "freeze": ["einfrieren", "stopp"], "off": ["aus"]},
    seasons: {"winter": ["winter"], "firstSnow": ["ersterschnee"], "thaw": ["tauwetter", "schmelze"], "spring": ["frühling"], "summer": ["sommer"], "autumn": ["herbst"]},
    occasions: {"valentinesDay": ["valentinstag"], "carnival": ["fasnacht", "fasching", "karneval"], "womensDay": ["tagderfrau", "frauentag"], "easter": ["ostern"], "orthodoxEaster": ["orthodoxeostern"], "sechselaeuten": ["sechseläuten", "böögg"], "labourDay": ["tagderarbeit"], "mothersDay": ["muttertag"], "fathersDay": ["vatertag"], "ascension": ["auffahrt", "himmelfahrt"], "pentecost": ["pfingsten"], "solstice": ["sonnenwende", "sommersonnenwende"], "midsummer": ["mittsommer"], "swissNationalDay": ["nationalfeiertag", "bundesfeier"], "stNicholas": ["nikolaus", "samichlaus"], "christmas": ["weihnachten"], "boxingDay": ["stephanstag"], "newYearsEve": ["silvester"], "newYear": ["neujahr"], "epiphany": ["dreikönigstag", "dreikönige"], "stMartin": ["martinstag", "martini"], "stLucia": ["luciafest"], "germanUnityDay": ["tagderdeutscheneinheit"], "kingsDay": ["königstag", "koenigstag"], "independenceDayUS": ["unabhängigkeitstag"], "dayOfTheDead": ["tagdertoten"], "childrensDay": ["kindertag"], "hanami": ["kirschblüte"], "lunarNewYear": ["chinesischesneujahr"], "midAutumn": ["mondfest"], "nowruz": ["nouruz"], "eidAlFitr": ["zuckerfest"], "eidAlAdha": ["opferfest"], "hanukkah": ["chanukka"], "vesak": ["vesakh"], "thanksgiving": ["erntedank"]},
  },
  fr: {
    commands: {"date": ["date"], "weather": ["météo"], "context": ["contexte"], "reset": ["réinitialiser"], "help": ["aide"], "falling": ["chute"], "figure": ["personnage"], "moon": ["lune"], "layout": ["disposition"], "region": ["région"], "occasions": ["fêtes"], "cheer": ["joie"], "fright": ["frayeur"], "language": ["langue"]},
    weather: {"clear": ["dégagé"], "sunset": ["crépuscule"], "fog": ["brouillard"], "magic": ["magie"]},
    falling: {"always": ["continu"], "burst": ["bref"], "freeze": ["figer"], "off": ["arrêt"]},
    seasons: {"winter": ["hiver"], "firstSnow": ["premièresneiges"], "thaw": ["dégel"], "spring": ["printemps"], "summer": ["été"], "autumn": ["automne"]},
    occasions: {"valentinesDay": ["saintvalentin"], "carnival": ["carnaval"], "womensDay": ["journéedesfemmes"], "easter": ["pâques"], "orthodoxEaster": ["pâquesorthodoxe"], "labourDay": ["fêtedutravail"], "mothersDay": ["fêtedesmères"], "fathersDay": ["fêtedespères"], "pentecost": ["pentecôte"], "solstice": ["solstice"], "swissNationalDay": ["fêtenationale", "premieraoût"], "stNicholas": ["saintnicolas"], "advent": ["avent"], "christmas": ["noël"], "newYearsEve": ["saintsylvestre", "réveillon"], "newYear": ["nouvelan"], "epiphany": ["épiphanie", "fêtedesrois"], "stPatricksDay": ["saintpatrick"], "stMartin": ["saintmartin"], "stLucia": ["saintelucie"], "bastilleDay": ["quatorzejuillet"], "kingsDay": ["fêteduroi"], "dayOfTheDead": ["jourdesmorts"], "lunarNewYear": ["nouvelanlunaire"], "midAutumn": ["miautomne"], "nowruz": ["norouz"], "eidAlFitr": ["aïd", "aïdelfitr"], "eidAlAdha": ["aïdelkébir"], "hanukkah": ["hanoukka"], "thanksgiving": ["actiondegrâce"]},
  },
  it: {
    commands: {"date": ["data"], "weather": ["meteo"], "context": ["contesto"], "reset": ["ripristina"], "help": ["aiuto"], "falling": ["caduta"], "figure": ["personaggio"], "moon": ["luna"], "layout": ["disposizione"], "region": ["regione"], "occasions": ["ricorrenze"], "cheer": ["gioia"], "fright": ["spavento"], "language": ["lingua"]},
    weather: {"clear": ["sereno"], "sunset": ["tramonto"], "fog": ["nebbia"], "magic": ["magia"]},
    falling: {"always": ["sempre"], "burst": ["breve"], "freeze": ["ferma"], "off": ["spenta"]},
    seasons: {"winter": ["inverno"], "firstSnow": ["primaneve"], "thaw": ["disgelo"], "spring": ["primavera"], "summer": ["estate"], "autumn": ["autunno"]},
    occasions: {"valentinesDay": ["sanvalentino"], "carnival": ["carnevale"], "womensDay": ["festadelladonna"], "easter": ["pasqua"], "orthodoxEaster": ["pasquaortodossa"], "labourDay": ["primomaggio", "festadeilavoratori"], "mothersDay": ["festadellamamma"], "fathersDay": ["festadelpapà"], "ascension": ["ascensione"], "pentecost": ["pentecoste"], "solstice": ["solstizio"], "swissNationalDay": ["festanazionale", "primoagosto"], "stNicholas": ["sannicola", "sannicolao"], "advent": ["avvento"], "christmas": ["natale"], "newYearsEve": ["sansilvestro"], "newYear": ["capodanno"], "epiphany": ["epifania", "befana"], "stPatricksDay": ["sanpatrizio"], "stMartin": ["sanmartino"], "stLucia": ["santalucia"], "italianRepublicDay": ["festadellarepubblica"], "dayOfTheDead": ["giornodeimorti"], "lunarNewYear": ["capodannolunare"], "midAutumn": ["metàautunno"], "thanksgiving": ["ringraziamento"]},
  },
  es: {
    commands: {"date": ["fecha"], "weather": ["tiempo"], "context": ["contexto"], "reset": ["restablecer"], "help": ["ayuda"], "falling": ["caída"], "figure": ["figura"], "moon": ["luna"], "layout": ["disposición"], "region": ["región"], "occasions": ["fiestas"], "cheer": ["alegría"], "fright": ["susto"], "language": ["idioma"]},
    weather: {"clear": ["despejado"], "sunset": ["atardecer"], "fog": ["niebla"], "magic": ["magia"]},
    falling: {"always": ["siempre"], "burst": ["breve"], "freeze": ["congelar"], "off": ["apagado"]},
    seasons: {"winter": ["invierno"], "firstSnow": ["primeranevada"], "thaw": ["deshielo"], "spring": ["primavera"], "summer": ["verano"], "autumn": ["otoño"]},
    occasions: {"valentinesDay": ["sanvalentín"], "carnival": ["carnaval"], "womensDay": ["díadelamujer"], "easter": ["pascua", "semanasanta"], "orthodoxEaster": ["pascuaortodoxa"], "labourDay": ["díadeltrabajo"], "mothersDay": ["díadelamadre"], "fathersDay": ["díadelpadre"], "ascension": ["ascensión"], "pentecost": ["pentecostés"], "solstice": ["solsticio"], "swissNationalDay": ["fiestanacionalsuiza"], "stNicholas": ["sannicolás"], "advent": ["adviento"], "christmas": ["navidad"], "newYearsEve": ["nochevieja"], "newYear": ["añonuevo"], "epiphany": ["reyes", "díadereyes"], "stPatricksDay": ["sanpatricio"], "stMartin": ["sanmartín"], "stLucia": ["santalucía"], "spanishNationalDay": ["fiestanacional", "hispanidad"], "mexicanIndependenceDay": ["gritodeindependencia"], "dayOfTheDead": ["díademuertos"], "lunarNewYear": ["añonuevolunar"], "midAutumn": ["medioutoño"], "hanukkah": ["janucá"], "thanksgiving": ["acciondegracias"]},
  },
}

/** Lower case without accents, so 'pâques' = 'paques' and 'Frühling' = 'fruhling'. */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** The help in one language, listing that language's words. */
export function helpFor(language: Language): string {
  const w = WORDS[language]
  const h = ALL[language].helpText
  const c = (k: CommandWord): string => w.commands[k][0] ?? k
  const examples = [w.seasons.summer[0], w.occasions.easter?.[0] ?? 'easter', 'halloween'].join(', ')
  const rows: [string, string][] = [
    ['/backdrop', h.show],
    [`/backdrop <…>`, `${h.seasonOrOccasion} ${examples}`],
    [`/backdrop ${c('date')} 2027-03-20`, h.date],
    [`/backdrop ${c('weather')} ${[w.weather.clear[0], w.weather.sunset[0], w.weather.fog[0], w.weather.magic[0]].join('|')}`, h.weather],
    [`/backdrop ${c('context')} 80`, h.context],
    [`/backdrop ${c('cheer')} | ${c('fright')}`, h.moods],
    [`/backdrop ${c('falling')} ${[w.falling.always[0], w.falling.burst[0], w.falling.freeze[0], w.falling.off[0]].join('|')}`, h.falling],
    [`/backdrop ${c('figure')} 20 | ${c('moon')} 85`, h.place],
    [`/backdrop ${c('layout')} ${c('reset')}`, h.layout],
    [`/backdrop ${c('region')} DE | auto`, h.region],
    [`/backdrop ${c('occasions')}`, h.occasions],
    [`/backdrop ${c('language')} fr | auto`, h.language],
    [`/backdrop ${c('reset')}`, h.reset],
    [`/backdrop ${c('help')}`, h.help],
  ]
  const width = Math.max(...rows.map(([cmd]) => cmd.length)) + 2
  return [h.title, ...rows.map(([cmd, what]) => `  ${cmd.padEnd(width)}${what}`), '', h.more].join('\n')
}
