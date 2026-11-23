// ─────────────────────────────────────────────────────────────────────────
//  WINTER LANDSCAPE SETTINGS
//
//  Change anything here without touching the rest of the code: edit the
//  values to the right of the colons and save. The scene reloads itself.
//
//  Colours are six-digit hex values, such as '#c0392b'.
//
//  Deutsch: Hier kannst du alles anpassen, ohne den restlichen Code zu
//  verstehen. Mit language: 'de' erscheinen alle Texte auf Deutsch.
// ─────────────────────────────────────────────────────────────────────────

/** Weather types: 'clear', 'sunset' or 'fog'. */
export type Weather = 'clear' | 'sunset' | 'fog'

/** Languages of the texts in the scene and of the /winter command: 'en' or 'de'. */
export type Language = 'en' | 'de'

export const SETTINGS = {
  /** Language of the label in the scene and the /winter replies. */
  language: 'en' as Language,

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
    easter: true,
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
