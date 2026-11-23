// ─────────────────────────────────────────────────────────────────────────
//  INTERACTIVE BACKGROUND SETTINGS
//
//  Change anything here without touching the rest of the code: edit the
//  values to the right of the colons and save. The scene reloads itself.
//
//  Colours are six-digit hex values, such as '#c0392b'.
//
//  Deutsch: Hier kannst du alles anpassen, ohne den restlichen Code zu
//  verstehen. Mit language: 'de' erscheinen alle Texte auf Deutsch.
// ─────────────────────────────────────────────────────────────────────────

/** Weather types: 'clear', 'sunset', 'fog' or 'magic'. */
export type Weather = 'clear' | 'sunset' | 'fog' | 'magic'

/** Hemispheres, for the seasons. */
export type Hemisphere = 'north' | 'south'

/**
 * How things fall: 'always', 'burst' (a few seconds after each change, then the sky
 * clears), 'freeze' (a few seconds, then everything stops in mid-air) or 'off'.
 */
export type FallingMode = 'always' | 'burst' | 'freeze' | 'off'

/** Languages of the texts in the scene and of the /winter command: 'en' or 'de'. */
export type Language = 'en' | 'de'

export const SETTINGS = {
  /** Language of the label in the scene and the /winter replies. */
  language: 'en' as Language,

  /**
   * Where the model and context label sits: 'top-right' or 'top-left', and how
   * far from the window's edges, in pixels. Raise offsetY if the app's title bar
   * covers it.
   */
  label: {
    position: 'top-right' as 'top-right' | 'top-left',
    offsetX: 24,
    offsetY: 56,
  },

  /**
   * Country whose occasions are shown: 'auto' (worked out from the system's time
   * zone and locale, shown by /backdrop) or an ISO 3166 code such as 'CH', 'DE', 'US'.
   */
  region: 'auto',

  /**
   * Local customs such as carnival dates and Sechseläuten: '' or an ISO 3166-2
   * code such as 'CH-ZH', 'CH-BS', 'CH-BE', 'CH-LU', 'DE-BY'. Never guessed.
   */
  subdivision: '',

  /** Which calendar day counts: 'auto' (the system's time zone) or an IANA name such as 'Europe/Zurich'. */
  timeZone: 'auto',

  /** For the seasons: 'auto' (from the time zone or region), 'north' or 'south'. */
  hemisphere: 'auto' as 'auto' | Hemisphere,

  /** false for places without snow: no snowman, a summer figure all year. */
  snow: true,

  /** Occasions from other regions or cultures to show as well, e.g. ['diwali', 'hanukkah']. */
  extraOccasions: [] as string[],

  /** On occasions the figure dresses up, e.g. a witch's hat on Halloween: true = on, false = off. */
  costumes: true,

  /**
   * Where the figure and the moon (or sun) stand, as a share of the window's
   * width: 0 is the left edge, 1 the right edge. The defaults keep them in the
   * free space beside the conversation. "/backdrop figure 20" and
   * "/backdrop moon 85" move them without editing this file.
   */
  layout: {
    figureX: 0.27,
    moonX: 0.8,
  },

  /**
   * How snow, leaves and petals fall: 'always', 'burst' (they fall for
   * burstSeconds after each change, such as the context filling or a click,
   * and then the sky clears), 'freeze' (the same, but they stop in mid-air)
   * or 'off'. "/backdrop falling burst" changes it
   * and remembers your choice.
   */
  falling: {
    mode: 'always' as FallingMode,
    burstSeconds: 8,
  },

  /** How many fir trees stand on the right (0 to 8). */
  trees: 3,

  /** Size of the snowman or scarecrow (0.6 to 1.6). */
  figureSize: 1.1,

  /** Colours of the accessories. */
  colors: {
    hat: '#2f6a9a',
    pompom: '#ffffff',
    scarf: '#c0392b',
    mittens: '#c0392b',
    broomHandle: '#8a5a2b',
    broomBristles: '#c9a35a',
  },

  /** From what share of the context (in percent) each accessory appears. */
  stages: {
    hat: 25,
    scarf: 50,
    broom: 75,
  },

  /** Number of snowflakes (or leaves, petals) with an empty and with a full context. */
  flakes: {
    minimum: 12,
    maximum: 240,
  },

  /**
   * Weather per model. The name on the left must appear in the model's name.
   * A model missing here gets 'clear'.
   */
  weatherByModel: {
    opus: 'clear',
    sonnet: 'sunset',
    haiku: 'fog',
    fable: 'magic',
  } as Record<string, Weather>,

  /** How long the click effects (flurry, smiling moon) last, in seconds. */
  clickEffectSeconds: 6,

  /**
   * The figure's moods: it cheers after passing tests and gets a fright after an error.
   * seconds: how long it cheers or startles.
   * onAnyError: true = also startle at errors outside of tests.
   */
  moods: {
    enabled: true,
    seconds: 5,
    onAnyError: true,
  },

  /** Which occasions are shown: true = on, false = off. */
  occasions: {
    valentinesDay: true,
    carnival: true,
    womensDay: true,
    easter: true,
    sechselaeuten: true,
    labourDay: true,
    mothersDay: true,
    ascension: true,
    pentecost: true,
    solstice: true,
    halloween: true,
    stNicholas: true,
    swissNationalDay: true,
    advent: true,
    christmas: true,
    newYear: true,
  },

  /**
   * Calendar of the seasons as [month, day]. Between a start and an end the
   * scene blends smoothly.
   */
  calendar: {
    /** The first snow settles … */
    snowStarts: [11, 1] as [number, number],
    /** … and from here everything is white. */
    snowComplete: [11, 15] as [number, number],
    /** The snowman is built during these days, ball by ball. */
    snowmanBuildStart: [11, 8] as [number, number],
    snowmanBuildEnd: [11, 15] as [number, number],
    /** Thaw: snow and snowman melt during this time. */
    thawStart: [3, 1] as [number, number],
    thawEnd: [3, 31] as [number, number],
  },
}
